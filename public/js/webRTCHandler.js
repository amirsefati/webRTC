import * as wss from "./wss.js";
import * as constants from "./constants.js";
import * as ui from "./ui.js";
import * as store from "./store.js";

let connectedFromUserDetails;
let peerConnection;
let dataChannel;

const defailtConstraints = {
  audio: true,
  video: true,
};
const configuration = {
  iceServer: {
    urls: "stun:stun.l.google.com:13902",
  },
};

export const getLocalPreview = () => {
  navigator.mediaDevices
    .getUserMedia(defailtConstraints)
    .then((stream) => {
      ui.updateLocalVideo(stream);
      store.setLocalStream(stream);
    })
    .catch((err) => {
      console.log("Error occured trying to get camera");
      console.log(err);
    });
};

const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection(configuration);

  dataChannel = peerConnection.createDataChannel("chat");
  peerConnection.ondatachannel = (event) => {
    const dataChannel = event.channel;
    dataChannel.onopen = () => {
      console.log("peer connection is ready to receive data channel messages");
    };
    dataChannel.onmessage = (event) => {
      console.log("message come from data channel");
      const message = JSON.parse(event.data);
      ui.appendMessage(message);
    };
  };
  peerConnection.onicecandidate = (event) => {
    console.log("geeting ice candidates from stun server");
    if (event.candidate) {
      //send our ice candidate to other peer
      wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedFromUserDetails.socketId,
        type: constants.webRTCSignaling.ICE_CANDIDATE,
        candidate: event.candidate,
      });
    }

    peerConnection.onconnectionstatechange = (event) => {
      if (peerConnection.connectionState === "connected") {
        console.log("succesfully connected with other peer");
      }
    };
  };

  // receiving tracks
  const remoteStream = new MediaStream();
  store.setRemoteStream(remoteStream);
  ui.updateRemoteVideo(remoteStream);

  peerConnection.ontrack = (event) => {
    remoteStream.addTrack(event.track);
  };

  // add our stream to peer connection
  if (
    connectedFromUserDetails.callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    const localStream = store.getState().localStream;
    for (const track of localStream.getTracks()) {
      peerConnection.addTrack(track, localStream);
    }
  }
};

export const sendMEssageUsingDataChannel = (message) => {
  const strigifiedMessage = JSON.stringify(message);
  dataChannel.send(strigifiedMessage);
};

export const sendPreOffer = (callType, calleePersonalCode) => {
  connectedFromUserDetails = {
    callType,
    socketId: calleePersonalCode,
  };
  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    const date = {
      callType,
      calleePersonalCode,
    };
    ui.showCallingDialog(callingDialogRejectCallHandler);
    wss.sendPreOffer(date);
  }
};

export const handlePreOffer = (data) => {
  const { callType, callerSocketId } = data;
  connectedFromUserDetails = {
    socketId: callerSocketId,
    callType,
  };

  if (
    callType === constants.callType.CHAT_PERSONAL_CODE ||
    callType === constants.callType.VIDEO_PERSONAL_CODE
  ) {
    console.log("showing call dialog");
    ui.showIncomingCallDialog(callType, acceptCallHandler, rejectCallHandler);
  }
};

const acceptCallHandler = () => {
  console.log("accepted");
  createPeerConnection();
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
  ui.showCallElements(connectedFromUserDetails.callType);
};

const rejectCallHandler = () => {
  console.log("rejeted");
  sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
};

const sendPreOfferAnswer = (preOfferAnswer) => {
  const data = {
    callerSocketId: connectedFromUserDetails.socketId,
    preOfferAnswer,
  };
  ui.removeAllDialogs();
  wss.sendPreOfferAnswer(data);
};

export const callingDialogRejectCallHandler = () => {};

export const handlePreOfferAnswer = (data) => {
  const { callerSocketId, preOfferAnswer } = data;
  ui.removeAllDialogs();

  if (preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND) {
    ui.showInfoDialog(preOfferAnswer);
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE) {
    ui.showInfoDialog(preOfferAnswer);
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED) {
    ui.showInfoDialog(preOfferAnswer);
  }

  if (preOfferAnswer === constants.preOfferAnswer.CALL_ACCEPTED) {
    ui.showCallElements(connectedFromUserDetails.callType);
    createPeerConnection();
    sendWebRTCOffer();
  }
};

const sendWebRTCOffer = async () => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedFromUserDetails.socketId,
    type: constants.webRTCSignaling.OFFER,
    offer: offer,
  });
};

export const handleWebRTCOffer = async (data) => {
  await peerConnection.setRemoteDescription(data.offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId: connectedFromUserDetails.socketId,
    type: constants.webRTCSignaling.ANSWER,
    answer: answer,
  });
};

export const handleWebRTCAnswer = async (data) => {
  console.log("Handelig webRTC answer");
  await peerConnection.setRemoteDescription(data.answer);
  console.log("setRemoteDescription");
};

export const handleWebRTCCandidate = async (data) => {
  console.log("handeling incoming WebRTC candidates");
  try {
    await peerConnection.addIceCandidate(data.candidate);
  } catch (err) {
    console.error(
      "error occured when trying to add recived ice candidate",
      err
    );
  }
};

let screenSharingStream;

export const switchBetweenCameraAndScreenSharing = async (
  screenSharingActive
) => {
  if (screenSharingActive) {
    const localStream = store.getState().localStream;
    const senders = peerConnection.getSenders();

    const sender = senders.find((sender) => {
      return sender.track.kind === localStream.getVideoTracks()[0].kind;
    });
    if (sender) {
      sender.replaceTrack(localStream.getVideoTracks()[0]);
    }
    store.getState();
    screenSharingStream.getTracks().forEach((track) => track.stop());

    store.setScreenSharingAvtice(!screenSharingActive);
    ui.updateLocalVideo(localStream);
  } else {
    console.log("switch to screen sharing");
    try {
      screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      store.setscreenSharingStream(screenSharingStream);

      const senders = peerConnection.getSenders();

      const sender = senders.find((sender) => {
        return (
          sender.track.kind === screenSharingStream.getVideoTracks()[0].kind
        );
      });

      if (sender) {
        sender.replaceTrack(screenSharingStream.getVideoTracks()[0]);
      }
      store.setScreenSharingAvtice(!screenSharingActive);
      ui.updateLocalVideo(screenSharingStream);
    } catch (err) {
      console.log(err);
    }
  }
};

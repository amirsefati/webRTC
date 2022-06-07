import * as wss from "./wss.js";
import * as constants from "./constants.js";
import * as ui from "./ui.js";
import * as store from "./store.js";

let connectedFromUserDetails;
let defailtConstraints = {
  audio: true,
  video: true,
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
    ui.showIncomingCallDialog(callType, acceptCallHandler, rejectCallHandler);
  }
};

const acceptCallHandler = () => {
  console.log("accepted");
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
  }
};

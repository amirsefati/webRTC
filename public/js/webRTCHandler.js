import * as wss from "./wss.js";
import * as constants from "./constants.js";
import * as ui from "./ui.js";

let connectedFromUserDetails;

export const sendPreOffer = (callType, calleePersonalCode) => {
  const date = {
    callType,
    calleePersonalCode,
  };
  wss.sendPreOffer(date);
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
};

const rejectCallHandler = () => {
  console.log("rejeted");
};

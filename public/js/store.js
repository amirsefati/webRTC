let state = {
  socketId: null,
  localStream: null,
  remoteStram: null,
  screenSharingStream: null,
  allowConnectionFromStrangers: false,
  screenSharingAvtice: false,
};

export const setSocketId = (socketId) => {
  state = {
    ...state,
    socketId: socketId,
  };
};

export const setLocalStream = (localStream) => {
  state = {
    ...state,
    localStream: localStream,
  };
};

export const setRemoteStream = (remoteStram) => {
  state = {
    ...state,
    remoteStram: remoteStram,
  };
};

export const setscreenSharingStream = (screenSharingStream) => {
  state = {
    ...state,
    screenSharingStream: screenSharingStream,
  };
};

export const setallowConnectionFromStrangers = (
  allowConnectionFromStrangers
) => {
  state = {
    ...state,
    allowConnectionFromStrangers: allowConnectionFromStrangers,
  };
};

export const setScreenSharingAvtice = (
  screenSharingAvtice
) => {
  state = {
    ...state,
    screenSharingAvtice: screenSharingAvtice,
  };
};



export const getState = () => {
  return state;
};

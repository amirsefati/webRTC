import * as store from "./store.js";
import * as ui from "./ui.js";
import * as webRTCHandler from "./webRTCHandler.js";

let sockerIO = null;

export const registerSocketEvent = (socket) => {
  sockerIO = socket;

  socket.on("connect", () => {
    console.log("succesfully connected to socket.io server");
    store.setSocketId(socket.id);
    ui.updatePersonalCode(socket.id);
  });

  socket.on("pre-offer", (data) => {
    webRTCHandler.handlePreOffer(data);
  });
};

export const sendPreOffer = (data) => {
  sockerIO.emit("pre-offer", data);
};

import * as store from "./store.js";
import * as wss from "./wss.js";

const socket = io("/");
wss.registerSocketEvent(socket);

const personalCodeCopyButton = document.getElementById(
  "personal_code_copy_button"
);
personalCodeCopyButton.addEventListener("click", () => {
  const personalCode = store.getState().socketId;
  navigator.clipboard && navigator.clipboard.writeText(personalCode);
});

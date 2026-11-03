import * as namesGenerator from "./modules/names_generator.js?v=owlytics-20261030";

document.addEventListener("DOMContentLoaded", () => {
  namesGenerator.ready();

  options.addEventListener("click", function (event) {
    if (event.target === options) {
      options.close();
    }
  });
});

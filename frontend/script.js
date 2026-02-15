let currentType = "url";

const inputArea = document.getElementById("inputArea");
const buttons = document.querySelectorAll(".tabs button");
const img = document.getElementById("qrImage");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const downloadBtn = document.getElementById("downloadBtn");

const BASE_URL = import.meta.env.QR_API_URL;

/* SWITCH TYPE */
function setType(event, type) {

  currentType = type;

  buttons.forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");

  img.style.display = "none";
  canvas.style.display = "none";
  downloadBtn.style.display = "none";

  switch(type) {

    case "url":
      inputArea.innerHTML = `<textarea id="url" placeholder="Enter URL"></textarea>`;
      break;

    case "email":
      inputArea.innerHTML = `<input id="email" placeholder="Enter Email">`;
      break;

    case "phone":
      inputArea.innerHTML = `<input id="phone" placeholder="Phone Number">`;
      break;

    case "text":
      inputArea.innerHTML = `<textarea id="text" placeholder="Enter Text"></textarea>`;
      break;

    case "vcard":
      inputArea.innerHTML = `
        <input id="first_name" placeholder="First Name">
        <input id="last_name" placeholder="Last Name">
        <input id="phone" placeholder="Phone">
        <input id="address" placeholder="Address">
      `;
      break;

    case "wifi":
      inputArea.innerHTML = `
        <select id="security">
          <option>WPA</option>
          <option>WPA2</option>
          <option>WPA3</option>
        </select>
        <input id="ssid" placeholder="SSID">
        <input id="password" placeholder="Password">
      `;
      break;

    case "custom":
      inputArea.innerHTML = `
        <input id="qrText" placeholder="Enter text or URL">
        <input type="color" id="bodyColor" value="#0d3b66">
        <input type="color" id="cornerColor" value="#00aaff">
        <select id="cornerType">
          <option value="a">All Corners</option>
          <option value="b">Top Left</option>
          <option value="c">Top Right</option>
          <option value="d">Bottom Left</option>
        </select>
        <input type="file" id="logoInput" accept="image/*">
      `;
      break;
  }
}

setType({target: buttons[0]}, "url");

/* GENERATE */
async function generateQR() {

  if (currentType === "custom") {
    return generateCustom();
  }

  let endpoint = "";
  let payload = {};

  switch(currentType) {

    case "url":
      endpoint = "/url";
      payload = { url: document.getElementById("url").value };
      break;

    case "email":
      endpoint = "/mail";
      payload = { email: document.getElementById("email").value };
      break;

    case "phone":
      endpoint = "/phone";
      payload = { number: document.getElementById("phone").value };
      break;

    case "text":
      endpoint = "/text";
      payload = { text: document.getElementById("text").value };
      break;

    case "vcard":
      endpoint = "/vcard";
      payload = {
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value
      };
      break;

    case "wifi":
      endpoint = "/wifi";
      payload = {
        security: document.getElementById("security").value,
        ssid: document.getElementById("ssid").value,
        password: document.getElementById("password").value
      };
      break;
  }

  const res = await fetch(BASE_URL + endpoint, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(payload)
  });

  const blob = await res.blob();
  const imgUrl = URL.createObjectURL(blob);

  img.src = imgUrl;
  img.style.display = "block";
  downloadBtn.href = imgUrl;
  downloadBtn.style.display = "inline";
}

/* CUSTOM QR */
async function generateCustom() {

  const formData = new FormData();
  formData.append("data", document.getElementById("qrText").value);
  formData.append("qr_fill", parseColor(document.getElementById("bodyColor").value));
  formData.append("box_color", parseColor(document.getElementById("cornerColor").value));
  formData.append("box_position", document.getElementById("cornerType").value);

  const logo = document.getElementById("logoInput").files[0];
  if (logo) formData.append("center_logo", logo);

  const res = await fetch(BASE_URL + "/custom-qr", {
    method:"POST",
    body:formData
  });

  const blob = await res.blob();
  displayCanvas(blob);
}

function displayCanvas(blob) {

  const imgUrl = URL.createObjectURL(blob);
  const qrImage = new Image();

  qrImage.onload = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 320 * dpr;
    canvas.height = 320 * dpr;
    canvas.style.width = "320px";
    canvas.style.height = "320px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.drawImage(qrImage,0,0,320,320);

    canvas.style.display = "block";
    downloadBtn.style.display = "inline";
    downloadBtn.onclick = () => {
      const data = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = data;
      a.download = "custom_qr.png";
      a.click();
    };
  };

  qrImage.src = imgUrl;
}

function parseColor(hex){
  const r=parseInt(hex.substr(1,2),16);
  const g=parseInt(hex.substr(3,2),16);
  const b=parseInt(hex.substr(5,2),16);
  return `${r},${g},${b}`;
}
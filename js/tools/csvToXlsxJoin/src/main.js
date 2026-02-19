if (
  location.protocol !== "https:" ||
  location.origin !== "https://cruzhenriquedev.github.io"
) {
  document.open();
  document.write("");
  document.close();
  throw new Error("blocked");
}
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const convertBtn = document.getElementById("convertBtn");
const clearBtn = document.getElementById("clearBtn");
const progressContainer = document.getElementById("progressContainer");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const alertBox = document.getElementById("alert");
let selectedFiles = [];
uploadArea.addEventListener("click", () => fileInput.click());
["dragenter", "dragover", "dragleave", "drop"].forEach((e) => {
  uploadArea.addEventListener(e, preventDefaults, false);
});
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}
["dragenter", "dragover"].forEach((e) => {
  uploadArea.addEventListener(e, () => {
    uploadArea.classList.add("dragover");
  });
});
["dragleave", "drop"].forEach((e) => {
  uploadArea.addEventListener(e, () => {
    uploadArea.classList.remove("dragover");
  });
});
uploadArea.addEventListener("drop", (e) => {
  const t = Array.from(e.dataTransfer.files).filter((e) =>
    e.name.toLowerCase().endsWith(".csv")
  );
  addFiles(t);
});
fileInput.addEventListener("change", (e) => {
  addFiles(Array.from(e.target.files));
});
function addFiles(e) {
  e.forEach((e) => {
    selectedFiles.some((t) => t.name === e.name) || selectedFiles.push(e);
  }),
    updateFileList(),
    (fileInput.value = "");
}
function updateFileList() {
  if (((fileList.innerHTML = ""), 0 === selectedFiles.length))
    return (convertBtn.disabled = !0), void (clearBtn.style.display = "none");
  (convertBtn.disabled = !1),
    (clearBtn.style.display = "block"),
    selectedFiles.forEach((e, t) => {
      const n = document.createElement("div");
      n.className = "file-item";
      const a = extractNumberFromFileName(e.name),
        o = a || (t + 1).toString(),
        d = document.createElement("div");
      (d.className = "file-number"), (d.textContent = o);
      const r = document.createElement("div");
      (r.style.display = "flex"),
        (r.style.alignItems = "center"),
        (r.style.flex = "1");
      const i = document.createElement("div"),
        l = document.createElement("div");
      (l.className = "file-name"), (l.textContent = e.name);
      const s = document.createElement("div");
      (s.className = "file-size"),
        (s.textContent = formatFileSize(e.size)),
        i.appendChild(l),
        i.appendChild(s),
        r.appendChild(d),
        r.appendChild(i);
      const c = document.createElement("button");
      (c.className = "remove-btn"),
        (c.textContent = "✕ Remover"),
        (c.onclick = () => removeFile(t)),
        n.appendChild(r),
        n.appendChild(c),
        fileList.appendChild(n);
    });
}
function removeFile(e) {
  selectedFiles.splice(e, 1), updateFileList();
}
clearBtn.addEventListener("click", () => {
  (selectedFiles = []), updateFileList(), hideAlert();
});
function formatFileSize(e) {
  if (0 === e) return "0 Bytes";
  const t = 1024,
    n = ["Bytes", "KB", "MB", "GB"],
    a = Math.floor(Math.log(e) / Math.log(t));
  return Math.round((e / Math.pow(t, a)) * 100) / 100 + " " + n[a];
}
function sanitizeSheetName(e) {
  let t = e.replace(".csv", "").replace(/[:\\\/\?\*\[\]]/g, "_");
  return t.length > 31 && (t = t.substring(0, 31)), t;
}
function extractNumberFromFileName(e) {
  const t = e.replace(".csv", ""),
    n = t.match(/E(\d+)/i);
  if (n) return n[1];
  const a = t.match(/\d+/);
  return a ? a[0] : null;
}
function generateUniqueSheetName(e, t) {
  let n = e,
    a = 2;
  for (; t.includes(n); ) (n = `${e}-${a}`), a++;
  return n;
}
convertBtn.addEventListener("click", async () => {
  if (0 === selectedFiles.length) return;
  hideAlert(), showProgress(), (convertBtn.disabled = !0);
  try {
    const e = XLSX.utils.book_new();
    let t = 0;
    const n = [];
    for (const a of selectedFiles) {
      t++, updateProgress(t, selectedFiles.length, `Processando: ${a.name}`);
      const o = await readFileAsText(a),
        d = Papa.parse(o, {
          delimiter: detectDelimiter(o),
          skipEmptyLines: !0,
        }),
        r = XLSX.utils.aoa_to_sheet(d.data),
        i = a.name.replace(".csv", "");
      let l;
      if (i.length <= 31) l = sanitizeSheetName(a.name);
      else {
        const e = extractNumberFromFileName(a.name);
        l = e || t.toString();
      }
      const s = generateUniqueSheetName(l, n);
      n.push(s), XLSX.utils.book_append_sheet(e, r, s);
    }
    updateProgress(100, 100, "Gerando arquivo Excel...");
    const a = XLSX.write(e, { bookType: "xlsx", type: "array" }),
      o = new Blob([a], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      d = window.URL.createObjectURL(o),
      r = document.createElement("a");
    (r.href = d),
      (r.download = `Consolidado_${getTimestamp()}.xlsx`),
      r.click(),
      window.URL.revokeObjectURL(d),
      showAlert(
        `✓ Sucesso! ${selectedFiles.length} arquivo(s) convertido(s). Abas nomeadas pelos números dos arquivos.`,
        "success"
      ),
      setTimeout(() => {
        (selectedFiles = []), updateFileList(), hideProgress();
      }, 2e3);
  } catch (e) {
    console.error("Erro na conversão:", e),
      showAlert(`✗ Erro ao converter arquivos: ${e.message}`, "error"),
      hideProgress();
  } finally {
    convertBtn.disabled = !1;
  }
});
function readFileAsText(e) {
  return new Promise((t, n) => {
    const a = new FileReader();
    (a.onload = (e) => t(e.target.result)),
      (a.onerror = n),
      a.readAsText(e, "UTF-8");
  });
}
function detectDelimiter(e) {
  const t = e.split("\n")[0],
    n = ["\t", ",", ";", "|"];
  let a = 0,
    o = ",";
  return (
    n.forEach((e) => {
      const n = (t.match(new RegExp("\\" + e, "g")) || []).length;
      n > a && ((a = n), (o = e));
    }),
    o
  );
}
function updateProgress(e, t, n) {
  const a = Math.round((e / t) * 100);
  (progressFill.style.width = a + "%"),
    (progressFill.textContent = a + "%"),
    (progressText.textContent = n);
}
function showProgress() {
  progressContainer.style.display = "block";
}
function hideProgress() {
  (progressContainer.style.display = "none"), (progressFill.style.width = "0%");
}
function showAlert(e, t) {
  (alertBox.textContent = e),
    (alertBox.className = `alert alert-${t}`),
    (alertBox.style.display = "block");
}
function hideAlert() {
  alertBox.style.display = "none";
}
function getTimestamp() {
  const e = new Date();
  return e.toISOString().replace(/[-:]/g, "").split(".")[0].replace("T", "_");
}

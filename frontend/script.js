async function analyzeResume() {
  const fileInput = document.getElementById('resumeFile');
  const resultsDiv = document.getElementById('analyzeResults');
  const loadingDiv = document.getElementById('analyzeLoading');

  if (!fileInput.files.length) {
    alert('Please select a PDF');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  resultsDiv.innerHTML = "";
  document.getElementById('downloadAnalyzeBtn').classList.add('hidden');
  loadingDiv.classList.remove('hidden');

  try {
    const res = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    loadingDiv.classList.add('hidden');

    if (data.error) {
      resultsDiv.innerHTML = `<div class="error-box">${data.error}</div>`;
      return;
    }

    renderAnalysis(data.analysis);
  } catch (err) {
    loadingDiv.classList.add('hidden');
    resultsDiv.innerHTML = `<div class="error-box">Error: ${err.message}</div>`;
  }
}

async function matchJob() {
  const fileInput = document.getElementById('resumeFile');
  const jobDescription = document.getElementById('jobDescription').value;
  const resultsDiv = document.getElementById('matchResults');
  const loadingDiv = document.getElementById('matchLoading');

  if (!fileInput.files.length) {
    alert('Please select a PDF');
    return;
  }

  if (!jobDescription.trim()) {
    alert('Please paste a job description');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('job_description', jobDescription);

  resultsDiv.innerHTML = "";
  document.getElementById('downloadMatchBtn').classList.add('hidden');
  loadingDiv.classList.remove('hidden');

  try {
    const res = await fetch('http://localhost:8000/match', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    loadingDiv.classList.add('hidden');

    if (data.error) {
      resultsDiv.innerHTML = `<div class="error-box">${data.error}</div>`;
      return;
    }

    renderMatch(data.match_result);
  } catch (err) {
    loadingDiv.classList.add('hidden');
    resultsDiv.innerHTML = `<div class="error-box">Error: ${err.message}</div>`;
  }
}

function renderAnalysis(analysis) {
  const resultsDiv = document.getElementById('analyzeResults');
  const score = analysis["ATS Score"] || 0;

  resultsDiv.innerHTML = `
    <div class="card">
      <div class="score-row">
        <div class="score-circle" style="--score: ${score}">
          <span>${score}</span>
        </div>
        <div>
          <h3>ATS Score</h3>
          <p class="score-label">${scoreLabel(score)}</p>
        </div>
      </div>

      ${renderList("Strengths", analysis["Strengths"], "tag-green")}
      ${renderList("Weaknesses", analysis["Weaknesses"], "tag-red")}
      ${renderList("Suggestions", analysis["Suggestions"], "tag-blue")}
    </div>
  `;

  document.getElementById('downloadAnalyzeBtn').classList.remove('hidden');
}

function renderMatch(match) {
  const resultsDiv = document.getElementById('matchResults');
  const score = match["Match Percentage"] || 0;

  resultsDiv.innerHTML = `
    <div class="card">
      <div class="score-row">
        <div class="score-circle" style="--score: ${score}">
          <span>${score}%</span>
        </div>
        <div>
          <h3>Match Percentage</h3>
          <p class="score-label">${scoreLabel(score)}</p>
        </div>
      </div>

      ${match["Summary"] ? `<p class="summary">${match["Summary"]}</p>` : ""}

      ${renderKeywordTags("Matching Keywords", match["Matching Keywords"], "tag-green")}
      ${renderKeywordTags("Missing Keywords", match["Missing Keywords"], "tag-red")}
      ${renderList("Suggestions", match["Suggestions"], "tag-blue")}
    </div>
  `;

  document.getElementById('downloadMatchBtn').classList.remove('hidden');
}

function renderList(title, items, className) {
  if (!items || items.length === 0) return "";
  const listItems = items.map(item => `<li class="${className}">${item}</li>`).join("");
  return `
    <div class="section">
      <h4>${title}</h4>
      <ul>${listItems}</ul>
    </div>
  `;
}

function renderKeywordTags(title, items, className) {
  if (!items || items.length === 0) return "";
  const tags = items.map(item => `<span class="tag ${className}">${item}</span>`).join("");
  return `
    <div class="section">
      <h4>${title}</h4>
      <div class="tag-container">${tags}</div>
    </div>
  `;
}

function scoreLabel(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Improvement";
  return "Poor";
}

async function downloadPDF(elementId, fileName) {
  const element = document.getElementById(elementId);

  if (!element || element.innerHTML.trim() === "") {
    alert("No results to download yet.");
    return;
  }

  const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
  heightLeft -= (pageHeight - 20);

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 20);
  }

  pdf.save(`${fileName}.pdf`);
}
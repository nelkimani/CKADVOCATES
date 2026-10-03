/* Shared behaviour: menu, copy buttons, enquiry form. */
(function () {
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (burger && nav) {
    burger.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]");
    if (!b) return;
    function done(label) { b.textContent = label; setTimeout(function () { b.textContent = "Copy"; }, 1800); }
    function fallback() {
      var t = b.parentElement.querySelector(".val a, .val");
      if (t) { var r = document.createRange(); r.selectNodeContents(t); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      done("Selected");
    }
    try { navigator.clipboard.writeText(b.dataset.copy).then(function () { done("Copied"); }, fallback); }
    catch (err) { fallback(); }
  });


  var form = document.getElementById("enquiry");
  if (!form) return;
  var el = function (id) { return document.getElementById(id); };
  var rules = {
    name: function (v) { return v.trim().length < 2 ? "Please enter your full name." : ""; },
    phone: function (v) { return !/^[+\d][\d\s()-]{6,}$/.test(v.trim()) ? "Please enter a phone number we can reach you on." : ""; },
    email: function (v) { return v.trim() && !/^\S+@\S+\.\S+$/.test(v.trim()) ? "Please check the email address." : ""; },
    message: function (v) { return v.trim().length < 10 ? "Please tell us a little about your matter." : ""; }
  };
  function check(n) {
    var f = form.elements[n];
    var msg = rules[n](f.value);
    el("e-" + n).textContent = msg;
    f.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }
  Object.keys(rules).forEach(function (n) { form.elements[n].addEventListener("blur", function () { check(n); }); });
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) { var bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    var endpoint = form.dataset.endpoint;
    function success() {
      var first = data.name.trim().split(/\s+/)[0];
      el("formWrap").innerHTML = '<div class="success" role="status" tabindex="-1" id="okBox"><h3>Thank you, ' + esc(first) + '.</h3>' +
        "<p>Your enquiry has been received. A member of the team will contact you by " + esc(String(data.method).toLowerCase()) + " as soon as possible.</p>" +
        (endpoint ? "" : '<p class="demo">Preview mode: no form service is connected yet, so nothing was sent. Set the form endpoint in build.js to deliver enquiries.</p>') + "</div>";
      el("okBox").focus();
    }
    if (!endpoint) return success();
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { if (r.ok) success(); else throw new Error("bad"); })
      .catch(function () { el("e-message").textContent = "We could not send your enquiry. Please try again or contact the firm by phone or WhatsApp."; });
  });
})();

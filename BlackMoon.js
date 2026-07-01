(function () {
    "use strict";

    const data = [
        { name: "BlackMoon", age: 20, address: "123 Main St" },
        { name: "Ahmed Ali", age: 22, address: "45 Cairo St" },
        { name: "Sara Hassan", age: 19, address: "78 Alex St" },
        { name: "Omar Youssef", age: 21, address: "90 Giza St" },
        { name: "Nour Mohamed", age: 23, address: "12 Luxor St" }
    ];

    const state = {
        filtered: [],
        sortField: null,
        sortAsc: true,
        token: "",
        tokenVisible: false
    };

    const dom = {};

    function cacheDom() {
        dom.count = document.getElementById("count");
        dom.tbody = document.getElementById("tbody");
        dom.search = document.getElementById("searchInput");
        dom.searchClear = document.getElementById("searchClear");
        dom.tokenBtn = document.getElementById("tokenBtn");
        dom.tokenDisplay = document.getElementById("tokenDisplay");
        dom.tokenValue = document.getElementById("tokenValue");
        dom.tokenMask = document.getElementById("tokenMask");
        dom.copyBtn = document.getElementById("copyBtn");
        dom.toggleBtn = document.getElementById("toggleMaskBtn");
        dom.revokeBtn = document.getElementById("revokeBtn");
        dom.tokenDot = document.getElementById("tokenDot");
        dom.empty = document.getElementById("emptyState");
        dom.toastBox = document.getElementById("toastContainer");
    }

    function sanitize(str) {
        if (typeof str !== "string") return "";
        const d = document.createElement("div");
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

    function toast(msg, type) {
        const el = document.createElement("div");
        el.className = "toast " + (type || "success");
        el.textContent = msg;
        dom.toastBox.appendChild(el);
        setTimeout(function () {
            el.classList.add("out");
            setTimeout(function () {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 300);
        }, 2500);
    }

    function updateStats() {
        dom.count.textContent = state.filtered.length;
    }

    function applyFilter() {
        const q = dom.search.value.trim().toLowerCase();
        state.filtered = [];
        for (let i = 0; i < data.length; i++) {
            const s = data[i];
            if (q === "") {
                state.filtered.push(s);
            } else if (s.name.toLowerCase().indexOf(q) !== -1 || s.address.toLowerCase().indexOf(q) !== -1) {
                state.filtered.push(s);
            }
        }
        if (state.sortField) {
            const f = state.sortField;
            const a = state.sortAsc;
            state.filtered.sort(function (x, y) {
                let vx = x[f];
                let vy = y[f];
                if (typeof vx === "string") vx = vx.toLowerCase();
                if (typeof vy === "string") vy = vy.toLowerCase();
                if (vx < vy) return a ? -1 : 1;
                if (vx > vy) return a ? 1 : -1;
                return 0;
            });
        }
        render();
    }

    function render() {
        dom.tbody.innerHTML = "";
        if (state.filtered.length === 0) {
            dom.empty.style.display = "block";
            updateStats();
            return;
        }
        dom.empty.style.display = "none";
        for (let i = 0; i < state.filtered.length; i++) {
            const s = state.filtered[i];
            const tr = document.createElement("tr");
            const td1 = document.createElement("td");
            td1.textContent = i + 1;
            const td2 = document.createElement("td");
            td2.textContent = s.name;
            const td3 = document.createElement("td");
            td3.textContent = s.age;
            const td4 = document.createElement("td");
            td4.textContent = s.address;
            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            dom.tbody.appendChild(tr);
        }
        updateStats();
    }

    function generateToken() {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const arr = new Uint32Array(48);
        crypto.getRandomValues(arr);
        let t = "";
        for (let i = 0; i < 48; i++) {
            t += chars[arr[i] % chars.length];
        }
        return t;
    }

    function obfuscate(t) {
        let r = "";
        for (let i = 0; i < t.length; i++) {
            r += String.fromCharCode(t.charCodeAt(i) ^ 42);
        }
        return btoa(r);
    }

    function deobfuscate(e) {
        try {
            const d = atob(e);
            let t = "";
            for (let i = 0; i < d.length; i++) {
                t += String.fromCharCode(d.charCodeAt(i) ^ 42);
            }
            return t;
        } catch (x) {
            return null;
        }
    }

    function showTokenUI() {
        dom.tokenBtn.style.display = "none";
        dom.tokenDisplay.style.display = "block";
        dom.tokenDot.classList.add("active");
        dom.tokenValue.textContent = state.token;
        state.tokenVisible = localStorage.getItem("bm_vis") === "1";
        updateMask();
    }

    function updateMask() {
        if (state.tokenVisible) {
            dom.tokenMask.style.display = "none";
            dom.toggleBtn.textContent = "إخفاء";
        } else {
            dom.tokenMask.style.display = "flex";
            dom.toggleBtn.textContent = "إظهار";
        }
    }

    function loadToken() {
        const saved = localStorage.getItem("bm_token");
        if (saved) {
            const t = deobfuscate(saved);
            if (t && t.length === 48 && /^[a-zA-Z0-9]+$/.test(t)) {
                state.token = t;
                showTokenUI();
            } else {
                localStorage.removeItem("bm_token");
                localStorage.removeItem("bm_vis");
            }
        }
    }

    function fallbackCopy() {
        try {
            const ta = document.createElement("textarea");
            ta.value = state.token;
            ta.style.position = "fixed";
            ta.style.left = "-9999px";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            toast("تم نسخ الرمز");
        } catch (e) {
            toast("فشل النسخ", "error");
        }
    }

    function bindEvents() {
        dom.tokenBtn.addEventListener("click", function () {
            state.token = generateToken();
            localStorage.setItem("bm_token", obfuscate(state.token));
            localStorage.setItem("bm_vis", "0");
            state.tokenVisible = false;
            showTokenUI();
            toast("تم إنشاء الرمز بنجاح");
        });

        dom.copyBtn.addEventListener("click", function () {
            if (!state.token) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(state.token).then(function () {
                    toast("تم نسخ الرمز");
                }).catch(fallbackCopy);
            } else {
                fallbackCopy();
            }
        });

        function toggleMask() {
            state.tokenVisible = !state.tokenVisible;
            localStorage.setItem("bm_vis", state.tokenVisible ? "1" : "0");
            updateMask();
        }

        dom.toggleBtn.addEventListener("click", toggleMask);
        dom.tokenMask.addEventListener("click", toggleMask);

        dom.revokeBtn.addEventListener("click", function () {
            state.token = "";
            localStorage.removeItem("bm_token");
            localStorage.removeItem("bm_vis");
            dom.tokenBtn.style.display = "inline-block";
            dom.tokenDisplay.style.display = "none";
            dom.tokenDot.classList.remove("active");
            toast("تم إلغاء الرمز");
        });

        let debounce = null;
        dom.search.addEventListener("input", function () {
            clearTimeout(debounce);
            dom.searchClear.style.display = dom.search.value.length > 0 ? "block" : "none";
            debounce = setTimeout(applyFilter, 200);
        });

        dom.searchClear.addEventListener("click", function () {
            dom.search.value = "";
            dom.searchClear.style.display = "none";
            applyFilter();
            dom.search.focus();
        });

        const ths = document.querySelectorAll("th[data-sort]");
        for (let i = 0; i < ths.length; i++) {
            (function (th) {
                th.style.cursor = "pointer";
                th.addEventListener("click", function () {
                    const field = th.getAttribute("data-sort");
                    if (state.sortField === field) {
                        state.sortAsc = !state.sortAsc;
                    } else {
                        state.sortField = field;
                        state.sortAsc = true;
                    }
                    const all = document.querySelectorAll("th[data-sort]");
                    for (let j = 0; j < all.length; j++) {
                        all[j].classList.remove("sorted");
                    }
                    th.classList.add("sorted");
                    applyFilter();
                });
            })(ths[i]);
        }
    }

    function init() {
        cacheDom();
        bindEvents();
        loadToken();
        applyFilter();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();

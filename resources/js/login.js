const USERS_STORAGE_KEY = "mrpizza-users";
const AUTH_LOGIN_STORAGE_KEY = "mrpizza-auth";
const AUTO_LOGIN_STORAGE_KEY = "mrpizza-auto-login";

const DEMO_USER = {
  id: 999999,
  email: "test@mrpizza.com",
  password: "Test1234!",
  name: "TEST USER",
  phone: "010-1234-5678",
  createdAt: new Date().toISOString(),
};

const form = document.querySelector(".auth-form");
const emailInput = document.querySelector("#loginEmail");
const passwordInput = document.querySelector("#login-pw");
const autoLoginInput = document.querySelector("#autoLogin");
const messageEl = document.querySelector("[data-login-message]");

function getUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY));
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function ensureDemoUser() {
  const users = getUsers();
  const exists = users.some((user) => String(user.email).toLowerCase() === DEMO_USER.email.toLowerCase());

  if (exists) return;

  users.push(DEMO_USER);
  saveUsers(users);
}

function saveLoginSession(payload) {
  localStorage.setItem(AUTH_LOGIN_STORAGE_KEY, JSON.stringify(payload));
}

function saveAutoLogin(flag) {
  localStorage.setItem(AUTO_LOGIN_STORAGE_KEY, JSON.stringify(Boolean(flag)));
}

function showMessage(text, type = "error") {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.dataset.state = type;
}

function clearMessage() {
  if (!messageEl) return;
  messageEl.textContent = "";
  delete messageEl.dataset.state;
}

function normalizeEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function findUserByEmail(email) {
  const users = getUsers();
  return users.find((user) => normalizeEmail(user.email) === normalizeEmail(email));
}

function getRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  if (!redirect) return "/pages/index.html";
  return redirect;
}

function handleLoginSubmit(e) {
  e.preventDefault();
  clearMessage();

  const email = emailInput?.value.trim() ?? "";
  const password = passwordInput?.value ?? "";
  const autoLogin = autoLoginInput?.checked ?? false;

  if (!email || !password) {
    showMessage("이메일과 비밀번호를 입력해주세요.");
    return;
  }

  const user = findUserByEmail(email);

  if (!user) {
    showMessage("가입된 이메일이 없습니다.");
    emailInput?.focus();
    return;
  }

  if (user.password !== password) {
    showMessage("비밀번호가 일치하지 않습니다.");
    passwordInput?.focus();
    return;
  }

  const authPayload = {
    isLoggedIn: true,
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    phone: user.phone ?? "",
    autoLogin,
    loginAt: new Date().toISOString(),
  };

  saveLoginSession(authPayload);
  saveAutoLogin(autoLogin);

  showMessage("로그인되었습니다.", "success");

  setTimeout(() => {
    window.location.href = getRedirectUrl();
  }, 300);
}

function redirectIfAlreadyLoggedIn() {
  try {
    const auth = JSON.parse(localStorage.getItem(AUTH_LOGIN_STORAGE_KEY));
    if (!auth?.isLoggedIn) return;

    window.location.href = "/pages/index.html";
  } catch {}
}

function bindComingSoonSocial() {
  const socialBtns = document.querySelectorAll(".auth-social__btn");

  socialBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      showMessage("소셜 로그인은 준비 중입니다.", "info");
    });
  });
}

function bindInputEvents() {
  [emailInput, passwordInput, autoLoginInput].forEach((input) => {
    input?.addEventListener("input", clearMessage);
    input?.addEventListener("change", clearMessage);
  });
}

function bindTestAccountToggle() {
  const toggleBtn = document.querySelector("[data-test-toggle]");
  const accountBox = document.querySelector("[data-test-account]");

  if (!toggleBtn || !accountBox) return;

  toggleBtn.addEventListener("click", () => {
    const isOpen = toggleBtn.getAttribute("aria-expanded") === "true";

    toggleBtn.setAttribute("aria-expanded", String(!isOpen));
    accountBox.hidden = isOpen;
    toggleBtn.textContent = isOpen ? "데모 계정 보기" : "데모 계정 닫기";
  });
}

function initLoginPage() {
  if (!form) return;

  ensureDemoUser();
  redirectIfAlreadyLoggedIn();
  bindComingSoonSocial();
  bindInputEvents();
  bindTestAccountToggle();
  form.addEventListener("submit", handleLoginSubmit);
}

initLoginPage();

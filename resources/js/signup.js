const USERS_STORAGE_KEY = "mrpizza-users";

const form = document.querySelector(".auth-form");
const emailInput = document.querySelector("#signupEmail");
const passwordInput = document.querySelector("#signupPassword");
const passwordConfirmInput = document.querySelector("#signupPasswordConfirm");
const nameInput = document.querySelector("#signupName");
const phoneInput = document.querySelector("#signupPhone");
const agreeInput = document.querySelector("#agreeAll");
const messageEl = document.querySelector("[data-signup-message]");

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

function normalizePhone(value) {
  return String(value ?? "")
    .replace(/[^\d]/g, "")
    .replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  return password.length >= 8 && hasLetter && hasNumber && hasSpecial;
}

function isValidPhone(phone) {
  return /^01[016789]-\d{3,4}-\d{4}$/.test(phone);
}

function isDuplicateEmail(email) {
  const users = getUsers();
  return users.some((user) => normalizeEmail(user.email) === normalizeEmail(email));
}

function focusInput(input) {
  input?.focus();
}

function handlePhoneInput() {
  const numbers = String(phoneInput?.value ?? "")
    .replace(/[^\d]/g, "")
    .slice(0, 11);

  if (numbers.length < 4) {
    phoneInput.value = numbers;
    return;
  }

  if (numbers.length < 8) {
    phoneInput.value = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return;
  }

  phoneInput.value = `${numbers.slice(0, 3)}-${numbers.slice(3, numbers.length === 10 ? 6 : 7)}-${numbers.slice(numbers.length === 10 ? 6 : 7)}`;
}

function handleSubmit(e) {
  e.preventDefault();
  clearMessage();

  const email = emailInput?.value.trim() ?? "";
  const password = passwordInput?.value ?? "";
  const passwordConfirm = passwordConfirmInput?.value ?? "";
  const name = nameInput?.value.trim() ?? "";
  const phone = normalizePhone(phoneInput?.value ?? "");
  const agreed = agreeInput?.checked ?? false;

  if (!email || !password || !passwordConfirm || !name || !phone) {
    showMessage("모든 항목을 입력해주세요.");
    return;
  }

  if (!isValidEmail(email)) {
    showMessage("올바른 이메일 형식으로 입력해주세요.");
    focusInput(emailInput);
    return;
  }

  if (isDuplicateEmail(email)) {
    showMessage("이미 가입된 이메일입니다.");
    focusInput(emailInput);
    return;
  }

  if (!isValidPassword(password)) {
    showMessage("비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.");
    focusInput(passwordInput);
    return;
  }

  if (password !== passwordConfirm) {
    showMessage("비밀번호 확인이 일치하지 않습니다.");
    focusInput(passwordConfirmInput);
    return;
  }

  if (!name) {
    showMessage("이름을 입력해주세요.");
    focusInput(nameInput);
    return;
  }

  if (!isValidPhone(phone)) {
    showMessage("휴대폰 번호를 올바르게 입력해주세요.");
    focusInput(phoneInput);
    return;
  }

  if (!agreed) {
    showMessage("이용약관 및 개인정보 처리방침에 동의해주세요.");
    focusInput(agreeInput);
    return;
  }

  const users = getUsers();

  const newUser = {
    id: Date.now(),
    email: normalizeEmail(email),
    password,
    name,
    phone,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  showMessage("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.", "success");

  form.reset();

  setTimeout(() => {
    window.location.href = "./login.html";
  }, 800);
}

function bindInputEvents() {
  [emailInput, passwordInput, passwordConfirmInput, nameInput, phoneInput, agreeInput].forEach((input) => {
    input?.addEventListener("input", clearMessage);
    input?.addEventListener("change", clearMessage);
  });

  phoneInput?.addEventListener("input", handlePhoneInput);
}

function initSignupPage() {
  if (!form) return;
  bindInputEvents();
  form.addEventListener("submit", handleSubmit);
}

initSignupPage();

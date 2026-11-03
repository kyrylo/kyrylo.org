const DOCKER_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]+$/;

function validateDockerContainerName(value) {
  const errors = [];
  const warnings = [];

  if (value === "") {
    return {
      status: "empty",
      dockerValid: false,
      dnsLabelFriendly: false,
      errors,
      warnings,
    };
  }

  if (value.length < 2) {
    errors.push("Docker container names must contain at least two characters.");
  }

  if (!/^[A-Za-z0-9]/.test(value)) {
    errors.push("The first character must be a letter or number.");
  }

  if (/\s/.test(value)) {
    errors.push("Whitespace is not allowed.");
  }

  if (/[^A-Za-z0-9_.-]/.test(value)) {
    errors.push("Only letters, numbers, underscores, periods, and hyphens are allowed.");
  }

  const dockerValid = DOCKER_NAME_PATTERN.test(value);

  if (/[A-Z]/.test(value)) {
    warnings.push("DNS labels use lowercase letters only.");
  }

  if (/[_\.]/.test(value)) {
    warnings.push("DNS labels allow hyphens, but not underscores or periods.");
  }

  if (value.startsWith("-") || value.endsWith("-")) {
    warnings.push("DNS labels cannot start or end with a hyphen.");
  }

  if (value.length > 63) {
    warnings.push("DNS labels cannot be longer than 63 characters.");
  }

  if (/[^a-z0-9-]/.test(value) && warnings.length === 0) {
    warnings.push("DNS labels may contain only lowercase letters, numbers, and hyphens.");
  }

  const dnsLabelFriendly =
    value.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value);

  return {
    status: dockerValid ? "valid" : "invalid",
    dockerValid,
    dnsLabelFriendly,
    errors,
    warnings,
  };
}

function appendMessages(container, messages) {
  const list = document.createElement("ul");
  messages.forEach((message) => {
    const item = document.createElement("li");
    item.textContent = message;
    list.appendChild(item);
  });
  container.appendChild(list);
}

function renderValidationResult(container, result) {
  container.replaceChildren();
  container.className = `validator__feedback validator__feedback--${result.status}`;

  const summary = document.createElement("p");

  if (result.status === "empty") {
    summary.textContent = "Enter a proposed container name to check it without changing it.";
    container.appendChild(summary);
    return;
  }

  if (result.status === "invalid") {
    summary.textContent = "This is not a valid Docker container name.";
    container.appendChild(summary);
    appendMessages(container, result.errors);
    return;
  }

  summary.textContent = result.dnsLabelFriendly
    ? "Valid for Docker and friendly as a lowercase DNS label."
    : "Valid for Docker, with DNS compatibility warnings.";
  container.appendChild(summary);

  if (result.warnings.length > 0) {
    appendMessages(container, result.warnings);
  }
}

function initializeContainerNameValidators(root = document) {
  root.querySelectorAll("[data-container-name-validator]").forEach((validator) => {
    const input = validator.querySelector("[data-validator-input]");
    const feedback = validator.querySelector("[data-validator-feedback]");

    if (!input || !feedback) return;

    const validate = () => {
      renderValidationResult(feedback, validateDockerContainerName(input.value));
    };

    input.addEventListener("input", validate);
    validate();
  });
}

export { initializeContainerNameValidators, validateDockerContainerName };

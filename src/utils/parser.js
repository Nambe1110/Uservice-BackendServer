const parseFullName = (fullName) => {
  const firstName = fullName.split(" ").slice(0, -1).join(" ");
  const lastName = fullName.split(" ").slice(-1).join(" ");

  return {
    firstName,
    lastName,
  };
};

export { parseFullName };

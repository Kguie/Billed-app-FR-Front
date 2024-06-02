export const formatDate = (dateStr) => {
  if (!dateStr) {
    return null;
  }
  //Ajout pour que la date entrée ne soit pas modifiée en fonction du fuseau horaire
  const [dateStrYear, dateStrMonth, dateStrDay] = dateStr
    .split("-")
    .map(Number);
  const date = new Date(Date.UTC(dateStrYear, dateStrMonth - 1, dateStrDay));
  const ye = new Intl.DateTimeFormat("fr", {
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  const mo = new Intl.DateTimeFormat("fr", {
    month: "short",
    timeZone: "UTC",
  }).format(date);
  const da = new Intl.DateTimeFormat("fr", {
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
  const month = mo.charAt(0).toUpperCase() + mo.slice(1);
  return `${parseInt(da)} ${month.substr(0, 3)}. ${ye.toString().substr(2, 4)}`;
};

export const formatStatus = (status) => {
  switch (status) {
    case "pending":
      return "En attente";
    case "accepted":
      return "Accepté";
    case "refused":
      return "Refused";
  }
};

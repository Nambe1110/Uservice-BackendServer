const hasHigherRole = (a, b) => {
  const map = new Map([
    ["Owner", 3],
    ["Manager", 2],
    ["Staff", 1],
  ]);

  return map.get(a) > map.get(b);
};

export default hasHigherRole;

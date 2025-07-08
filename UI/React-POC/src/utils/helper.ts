export function reverseKeyMap(map: Record<string, string>): Record<string, string> {
  // debugger
  const reversed: Record<string, string> = {};
  for (const key in map) {
    reversed[map[key]] = key;
  }
  return reversed;
}

export function camelToPascal(camel) {
  try{
    return camel?.charAt(0).toUpperCase() + camel.slice(1);
  }catch(e){
    return camel;
  }
}

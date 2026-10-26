'use strict';
// Shared by the server and its unit tests. clean is the username profanity filter.
function validate(value, clean) {
  if (!value || typeof value.first !== 'string' || !['m', 'f'].includes(value.g)) return { error: 'Choose Boy or Girl and a first name.' };
  const first = value.first;
  if (first.length < 2 || first.length > 14 || !/^[A-Za-z]+(?:[-'][A-Za-z]+)?$/.test(first)) return { error: "Use 2 to 14 letters, with at most one hyphen or apostrophe between letters." };
  if (clean(first, 14) !== first) return { error: "That first name isn't allowed. Keep it clean!" };
  return { me: { first: first.toLowerCase().replace(/(^|[-'])[a-z]/g, s => s.toUpperCase()), g: value.g, v: 1 } };
}
function current(key, member) {
  if (key.toLowerCase() === 'jack' && (member.me?.first !== 'Jack' || member.me?.g !== 'm' || member.me?.v !== 1)) member.me = { first: 'Jack', g: 'm', v: 1 };
  return member.me || null;
}
function set(key, member, value, clean) {
  if (key.toLowerCase() === 'jack') { current(key, member); return { error: "Jack's identity is fixed." }; }
  const result = validate(value, clean);
  if (result.me) member.me = result.me;
  return result;
}
module.exports = { validate, current, set };

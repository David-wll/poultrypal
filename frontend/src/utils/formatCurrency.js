export function formatNaira(amount) {
  return '₦' + Number(amount).toLocaleString('en-NG')
}
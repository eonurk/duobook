/**
 * Cookie utility functions for handling cookies in the browser
 */

/**
 * Set a cookie with the given name, value, and optional days to expiration
 * @param {string} name - The name of the cookie
 * @param {string} value - The value to store in the cookie
 * @param {number} days - Number of days until cookie expires
 */
export function setCookie(name, value, days = 365) {
	const date = new Date();
	date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
	const expires = `expires=${date.toUTCString()}`;
	document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
}

/**
 * Get a cookie by name
 * @param {string} name - The name of the cookie to retrieve
 * @returns {string|null} - The cookie value or null if not found
 */
export function getCookie(name) {
	const nameEQ = `${name}=`;
	const ca = document.cookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === " ") c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

/**
 * Check if a cookie exists
 * @param {string} name - The name of the cookie to check
 * @returns {boolean} - Whether the cookie exists
 */
export function hasCookie(name) {
	return getCookie(name) !== null;
}

/**
 * Delete a cookie by name
 * @param {string} name - The name of the cookie to delete
 */
export function deleteCookie(name) {
	document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
}

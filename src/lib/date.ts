/**
 * Normalize various date formats to ISO YYYY-MM-DD.
 * Handles: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, M/D/YYYY, D/M/YYYY,
 *          DD-MM-YYYY, MM-DD-YYYY, YYYY/MM/DD, and more.
 * Returns null if it can't parse.
 */
export function normalizeDate(input: string): string | null {
	const s = input.trim().replace(/['"]/g, '');
	if (!s) return null;

	// Already ISO: YYYY-MM-DD
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
		return validateDate(s) ? s : null;
	}

	// YYYY/MM/DD
	if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s)) {
		const [y, m, d] = s.split('/');
		const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
		return validateDate(iso) ? iso : null;
	}

	// Formats with / separator: could be M/D/Y or D/M/Y
	if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) {
		const parts = s.split('/');
		const a = parseInt(parts[0], 10);
		const b = parseInt(parts[1], 10);
		let y = parseInt(parts[2], 10);
		if (y < 100) y += 2000;

		// Try M/D/Y first (US format) — if first part > 12 then it must be D/M/Y
		if (a > 12 && b <= 12) {
			// D/M/Y
			const iso = `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
			return validateDate(iso) ? iso : null;
		}
		// M/D/Y (default for ambiguous)
		const iso = `${y}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
		if (validateDate(iso)) return iso;
		// Fallback: try D/M/Y
		const iso2 = `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
		return validateDate(iso2) ? iso2 : null;
	}

	// Formats with - separator: DD-MM-YYYY or MM-DD-YYYY
	if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(s)) {
		const parts = s.split('-');
		const a = parseInt(parts[0], 10);
		const b = parseInt(parts[1], 10);
		let y = parseInt(parts[2], 10);
		if (y < 100) y += 2000;

		if (a > 12 && b <= 12) {
			const iso = `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
			return validateDate(iso) ? iso : null;
		}
		const iso = `${y}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
		if (validateDate(iso)) return iso;
		const iso2 = `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
		return validateDate(iso2) ? iso2 : null;
	}

	// Last resort: try native Date parsing
	const d = new Date(s);
	if (!isNaN(d.getTime())) {
		return d.toISOString().split('T')[0];
	}

	return null;
}

function validateDate(iso: string): boolean {
	const d = new Date(iso + 'T00:00:00');
	if (isNaN(d.getTime())) return false;
	const [y, m, day] = iso.split('-').map(Number);
	return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}

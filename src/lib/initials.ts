export function getInitials(value?: string | null, fallback = "?"): string {
	if (!value) return fallback;
	const cleaned = value.trim().replace(/\s+/g, " ");
	if (!cleaned) return fallback;
	const parts = cleaned.split(" ").filter(Boolean);
	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase();
	}
	const first = parts[0][0] ?? "";
	const last = parts[parts.length - 1][0] ?? "";
	return (first + last).toUpperCase() || fallback;
}

// Cloud integration acceptance requirements:
// 1. A signed-out client cannot read or write another user's data.
// 2. A revision mismatch never overwrites the newer cloud copy.
// 3. A failed request preserves the local copy and reports an error.
// 4. Importing existing browser data requires explicit user confirmation.
// 5. Two authenticated devices converge after a successful save and refresh.
// These checks must run against an isolated test project before enabling production sync.

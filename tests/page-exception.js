'use strict';

// CDP sets exceptionDetails.text to "Uncaught" and the real sentence on
// exception.description. Callers that read text first hide the page error.
function pageExceptionText(details) {
  const ex = details && details.exception;
  const described = ex && (ex.description || ex.value);
  return described || (details && details.text) || 'eval failed';
}

module.exports = { pageExceptionText };

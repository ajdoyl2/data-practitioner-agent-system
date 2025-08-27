const transformError = (e) => {
  if (!(e instanceof Error)) {
    console.log(`Page threw a non-error`, { error: e });
    return JSON.parse(JSON.stringify(e));
  } else {
    return {
      message: e.message,
      stack: e.stack,
      name: e.name,
      cause: e.cause ? transformError(e.cause) : void 0
    };
  }
};
const handleError = (e) => transformError(e.error);
export {
  handleError
};

fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/health`)
  .then((response) => {
    if (!response.ok) process.exitCode = 1;
  })
  .catch(() => {
    process.exitCode = 1;
  });

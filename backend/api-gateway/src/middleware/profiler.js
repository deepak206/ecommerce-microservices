const profiler = (req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const status = process.memoryUsage();
    const duration = diff[0] * 1e3 + diff[1] * 1e-6;
    console.log({
        service: 'API-gateway',
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration.toFixed(3)} ms`,
        rss: `${(status.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(status.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(status.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(status.external / 1024 / 1024).toFixed(2)} MB`,
        arrayBuffers: `${(status.arrayBuffers / 1024 / 1024).toFixed(2)} MB`,
      });
  })
  next();
}

export default profiler;
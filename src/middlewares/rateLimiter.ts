import rateLimit from 'express-rate-limit';

// Protection contre le Bruteforce et le DDoS
// En prod, on utiliserait un store Redis pour partager l'état entre les instances (Cluster/K8s)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par "window" (ici 15 min)
  standardHeaders: true, // Retourne les infos de limite dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Vous avez effectué trop de requêtes. Veuillez réessayer dans 15 minutes.'
  }
});

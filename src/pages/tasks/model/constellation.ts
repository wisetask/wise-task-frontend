export interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface StarLink {
  from: number;
  to: number;
  strength: number;
}

export const STAR_SPEED = 14;

export function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state = state + 2147483646;
  }
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function createStars(count: number, width: number, height: number, seed: number): Star[] {
  const random = seededRandom(seed);
  const stars: Star[] = [];
  for (let index = 0; index < count; index++) {
    const angle = random() * Math.PI * 2;
    const speed = STAR_SPEED * (0.4 + random() * 0.6);
    stars.push({
      x: random() * width,
      y: random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
  return stars;
}

function bounce(position: number, speed: number, size: number): number[] {
  if (position < 0) {
    return [-position, Math.abs(speed)];
  }
  if (position > size) {
    return [size * 2 - position, -Math.abs(speed)];
  }
  return [position, speed];
}

export function moveStars(stars: Star[], seconds: number, width: number, height: number): Star[] {
  const result: Star[] = [];
  for (const star of stars) {
    const across = bounce(star.x + star.vx * seconds, star.vx, width);
    const down = bounce(star.y + star.vy * seconds, star.vy, height);
    result.push({ x: across[0], y: down[0], vx: across[1], vy: down[1] });
  }
  return result;
}

export function starLinks(stars: Star[], distance: number): StarLink[] {
  const links: StarLink[] = [];
  for (let first = 0; first < stars.length; first++) {
    for (let second = first + 1; second < stars.length; second++) {
      const dx = stars[first].x - stars[second].x;
      const dy = stars[first].y - stars[second].y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length < distance) {
        links.push({
          from: first,
          to: second,
          strength: Math.round((1 - length / distance) * 100) / 100,
        });
      }
    }
  }
  return links;
}

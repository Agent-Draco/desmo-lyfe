import React, { useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

// Surface function types from the article
type SurfaceFunction = (x: number) => number;

const createConvexCircle: SurfaceFunction = (x: number) => 1 - Math.pow(1 - x, 2);
const createConvexSquircle: SurfaceFunction = (x: number) => 1 - Math.pow(1 - x, 4);
const createConcave: SurfaceFunction = (x: number) => 1 - createConvexCircle(x);
const createLip: SurfaceFunction = (x: number) => {
  const convex = createConvexCircle(x);
  const concave = createConcave(x);
  const t = x * x * (3 - 2 * x); // Smootherstep
  return convex * (1 - t) + concave * t;
};

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  surfaceType?: 'convex-circle' | 'convex-squircle' | 'concave' | 'lip';
  bezelWidth?: number;
  glassThickness?: number;
  refractiveIndex?: number;
  scale?: number;
  specularIntensity?: number;
}

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  className,
  surfaceType = 'convex-squircle',
  bezelWidth = 20,
  glassThickness = 10,
  refractiveIndex = 1.5,
  scale = 1.0,
  specularIntensity = 0.5,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const filterId = useMemo(() => `liquid-glass-${Math.random().toString(36).substr(2, 9)}`, []);

  const surfaceFunction = useMemo(() => {
    switch (surfaceType) {
      case 'convex-circle': return createConvexCircle;
      case 'convex-squircle': return createConvexSquircle;
      case 'concave': return createConcave;
      case 'lip': return createLip;
      default: return createConvexSquircle;
    }
  }, [surfaceType]);

  const { displacementMap, maximumDisplacement, specularMap } = useMemo(() => {
    const width = 256;
    const height = 256;
    const samples = 127;

    // Pre-calculate displacement magnitudes
    const displacementMagnitudes: number[] = [];
    const maxDistance = Math.min(width, height) / 2;

    for (let i = 0; i <= samples; i++) {
      const distanceFromBorder = i / samples;
      const height = surfaceFunction(distanceFromBorder) * glassThickness;

      // Calculate angle of incidence
      const delta = 0.001;
      const y1 = surfaceFunction(Math.max(0, distanceFromBorder - delta)) * glassThickness;
      const y2 = surfaceFunction(Math.min(1, distanceFromBorder + delta)) * glassThickness;
      const derivative = (y2 - y1) / (2 * delta);
      const normalAngle = Math.atan2(1, -derivative);

      // Snell's Law: n1 * sin(θ1) = n2 * sin(θ2)
      const theta1 = normalAngle;
      const theta2 = Math.asin((1 * Math.sin(theta1)) / refractiveIndex);

      // Calculate displacement
      const displacement = Math.tan(theta2 - theta1) * height;
      displacementMagnitudes.push(Math.abs(displacement));
    }

    const maximumDisplacement = Math.max(...displacementMagnitudes);

    // Create displacement map
    const displacementCanvas = document.createElement('canvas');
    displacementCanvas.width = width;
    displacementCanvas.height = height;
    const displacementCtx = displacementCanvas.getContext('2d')!;
    const displacementImageData = displacementCtx.createImageData(width, height);

    // Create specular highlight map
    const specularCanvas = document.createElement('canvas');
    specularCanvas.width = width;
    specularCanvas.height = height;
    const specularCtx = specularCanvas.getContext('2d')!;
    const specularImageData = specularCtx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const centerX = width / 2;
        const centerY = height / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = Math.min(width, height) / 2;

        if (distance <= maxRadius) {
          const normalizedDistance = distance / maxRadius;
          const distanceFromBorder = 1 - normalizedDistance;

          // Get displacement magnitude for this distance
          const sampleIndex = Math.floor(distanceFromBorder * samples);
          const displacementMagnitude = displacementMagnitudes[Math.min(sampleIndex, samples)] || 0;
          const normalizedDisplacement = displacementMagnitude / maximumDisplacement;

          // Calculate displacement vector (radial)
          const angle = Math.atan2(dy, dx);
          const displacementX = Math.cos(angle) * normalizedDisplacement;
          const displacementY = Math.sin(angle) * normalizedDisplacement;

          // Convert to RGBA for displacement map
          const r = Math.round(128 + displacementX * 127);
          const g = Math.round(128 + displacementY * 127);
          const b = 128;
          const a = 255;

          const pixelIndex = (y * width + x) * 4;
          displacementImageData.data[pixelIndex] = r;
          displacementImageData.data[pixelIndex + 1] = g;
          displacementImageData.data[pixelIndex + 2] = b;
          displacementImageData.data[pixelIndex + 3] = a;

          // Specular highlight (rim light effect)
          const rimFactor = Math.pow(1 - normalizedDistance, 2);
          const specularValue = Math.round(255 * specularIntensity * rimFactor);

          specularImageData.data[pixelIndex] = specularValue;
          specularImageData.data[pixelIndex + 1] = specularValue;
          specularImageData.data[pixelIndex + 2] = specularValue;
          specularImageData.data[pixelIndex + 3] = 255;
        }
      }
    }

    displacementCtx.putImageData(displacementImageData, 0, 0);
    specularCtx.putImageData(specularImageData, 0, 0);

    return {
      displacementMap: displacementCanvas.toDataURL(),
      specularMap: specularCanvas.toDataURL(),
      maximumDisplacement,
    };
  }, [surfaceFunction, bezelWidth, glassThickness, refractiveIndex, specularIntensity]);

  return (
    <>
      <svg
        ref={svgRef}
        style={{ position: 'absolute', width: 0, height: 0 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            {/* Displacement map for refraction */}
            <feImage
              href={displacementMap}
              x="0"
              y="0"
              width="100%"
              height="100%"
              result="displacement_map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="displacement_map"
              scale={maximumDisplacement * scale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="refracted"
            />

            {/* Specular highlight */}
            <feImage
              href={specularMap}
              x="0"
              y="0"
              width="100%"
              height="100%"
              result="specular_map"
            />

            {/* Combine refraction and specular */}
            <feBlend
              in="refracted"
              in2="specular_map"
              mode="screen"
            />
          </filter>
        </defs>
      </svg>

      <div
        className={cn(
          "relative overflow-hidden",
          className
        )}
        style={{
          backdropFilter: `url(#${filterId})`,
          WebkitBackdropFilter: `url(#${filterId})`,
        }}
      >
        {children}
      </div>
    </>
  );
};

import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-rotate-video-gen',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzUploadModule,
    NzInputModule,
    NzSliderModule,
    NzCardModule,
    NzSpaceModule,
    NzDividerModule,
    NzProgressModule,
    NzIconModule,
    NzSpinModule,
    NzSelectModule,
    NzInputNumberModule,
    NzSwitchModule
  ],
  templateUrl: './rotate-video-gen.component.html',
  styleUrl: './rotate-video-gen.component.css'
})
export class RotateVideoGenComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvasContainer', { static: false }) canvasContainer!: ElementRef;
  @ViewChild('canvas', { static: false }) canvas!: ElementRef;

  // Three.js properties
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private model!: THREE.Group;
  private animationId!: number;

  // Component state
  isModelLoaded = false;
  isExporting = false;
  exportProgress = 0;
  selectedFile: File | null = null;
  fileName = '';

  // Video export settings
  videoSettings = {
    duration: 5, // seconds
    fps: 30,
    resolution: '1080p',
    rotationSpeed: 1, // rotations per second
    backgroundColor: '#00ff00', // Green screen color
    enableAutoRotate: true,
    cameraDistance: 5,
    enableShadows: true,
    quality: 'high'
  };

  // Available resolutions
  resolutions = [
    { label: '720p (1280x720)', value: '720p', width: 1280, height: 720 },
    { label: '1080p (1920x1080)', value: '1080p', width: 1920, height: 1080 },
    { label: '4K (3840x2160)', value: '4k', width: 3840, height: 2160 }
  ];

  // Quality options
  qualityOptions = [
    { label: 'Low (Fast)', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High (Slow)', value: 'high' }
  ];

  constructor(private message: NzMessageService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initThreeJS();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThreeJS(): void {
    if (!this.canvasContainer || !this.canvas) return;

    const container = this.canvasContainer.nativeElement;
    const canvas = this.canvas.nativeElement;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.videoSettings.backgroundColor);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, this.videoSettings.cameraDistance);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = this.videoSettings.enableShadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    this.setupLighting();

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start render loop
    this.animate();
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = this.videoSettings.enableShadows;
    if (this.videoSettings.enableShadows) {
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
    }
    this.scene.add(directionalLight);

    // Point light for better model illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-10, -10, -5);
    this.scene.add(pointLight);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    if (this.model && this.videoSettings.enableAutoRotate) {
      this.model.rotation.y += (Math.PI * 2 * this.videoSettings.rotationSpeed) / (this.videoSettings.fps * this.videoSettings.duration);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    if (!this.canvasContainer || !this.camera || !this.renderer) return;

    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'model/gltf-binary' || file.name.endsWith('.glb')) {
      this.selectedFile = file;
      this.fileName = file.name;
      this.loadGLBFile(file);
    } else {
      this.message.error('Please select a valid GLB file');
    }
  }

  private loadGLBFile(file: File): void {
    const loader = new GLTFLoader();
    const url = URL.createObjectURL(file);

    loader.load(
      url,
      (gltf) => {
        // Remove previous model if exists
        if (this.model) {
          this.scene.remove(this.model);
        }

        this.model = gltf.scene;
        
        // Center and scale the model
        this.centerAndScaleModel();
        
        // Enable shadows for model
        this.model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = this.videoSettings.enableShadows;
            child.receiveShadow = this.videoSettings.enableShadows;
          }
        });

        this.scene.add(this.model);
        this.isModelLoaded = true;
        
        // Update camera position based on model size
        this.updateCameraPosition();
        
        this.message.success('GLB file loaded successfully!');
        URL.revokeObjectURL(url);
      },
      (progress) => {
        console.log('Loading progress:', progress);
      },
      (error) => {
        this.message.error('Error loading GLB file: ' + (error as Error).message);
        URL.revokeObjectURL(url);
      }
    );
  }

  private centerAndScaleModel(): void {
    if (!this.model) return;

    const box = new THREE.Box3().setFromObject(this.model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Center the model
    this.model.position.sub(center);
    
    // Scale to fit in view
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    this.model.scale.setScalar(scale);
  }

  private updateCameraPosition(): void {
    if (!this.model) return;

    const box = new THREE.Box3().setFromObject(this.model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    this.camera.position.z = maxDim * this.videoSettings.cameraDistance;
    this.camera.updateMatrixWorld();
  }

  onSettingsChange(): void {
    if (this.scene) {
      this.scene.background = new THREE.Color(this.videoSettings.backgroundColor);
    }
    
    if (this.renderer) {
      this.renderer.shadowMap.enabled = this.videoSettings.enableShadows;
    }
    
    if (this.camera) {
      this.updateCameraPosition();
    }
  }

  async exportVideo(): Promise<void> {
    if (!this.isModelLoaded) {
      this.message.error('Please load a GLB file first');
      return;
    }

    this.isExporting = true;
    this.exportProgress = 0;

    try {
      const selectedResolution = this.resolutions.find(r => r.value === this.videoSettings.resolution);
      if (!selectedResolution) {
        throw new Error('Invalid resolution selected');
      }

      const canvas = await this.generateVideoFrames(selectedResolution);
      const blob = await this.canvasToVideo(canvas);
      
      // Download the video
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rotating_${this.fileName.replace('.glb', '')}.webm`;
      a.click();
      URL.revokeObjectURL(url);

      this.message.success('Video exported successfully!');
    } catch (error) {
      this.message.error('Error exporting video: ' + (error as Error).message);
    } finally {
      this.isExporting = false;
      this.exportProgress = 0;
    }
  }

  private async generateVideoFrames(resolution: any): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = resolution.width;
      canvas.height = resolution.height;
      const ctx = canvas.getContext('2d')!;

      const totalFrames = this.videoSettings.duration * this.videoSettings.fps;
      let currentFrame = 0;

      const renderFrame = () => {
        if (currentFrame >= totalFrames) {
          resolve(canvas);
          return;
        }

        // Calculate rotation for this frame
        const rotation = (currentFrame / totalFrames) * Math.PI * 2 * this.videoSettings.rotationSpeed;
        
        // Temporarily set rotation
        if (this.model) {
          this.model.rotation.y = rotation;
        }

        // Render to off-screen canvas
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = resolution.width;
        offscreenCanvas.height = resolution.height;
        
        const offscreenRenderer = new THREE.WebGLRenderer({ 
          canvas: offscreenCanvas,
          antialias: true,
          alpha: true
        });
        offscreenRenderer.setSize(resolution.width, resolution.height);
        offscreenRenderer.setClearColor(this.videoSettings.backgroundColor, 1);

        // Create temporary scene and camera for this frame
        const tempScene = this.scene.clone();
        const tempCamera = this.camera.clone();
        tempCamera.aspect = resolution.width / resolution.height;
        tempCamera.updateProjectionMatrix();

        offscreenRenderer.render(tempScene, tempCamera);

        // Draw frame to main canvas
        ctx.drawImage(offscreenCanvas, 0, 0);

        // Clean up
        offscreenRenderer.dispose();

        currentFrame++;
        this.exportProgress = (currentFrame / totalFrames) * 100;

        // Continue with next frame
        requestAnimationFrame(renderFrame);
      };

      renderFrame();
    });
  }

  private async canvasToVideo(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const stream = canvas.captureStream(this.videoSettings.fps);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      mediaRecorder.onerror = (error) => {
        reject(error);
      };

      mediaRecorder.start();
      
      // Stop recording after duration
      setTimeout(() => {
        mediaRecorder.stop();
      }, this.videoSettings.duration * 1000);
    });
  }

  resetCamera(): void {
    if (this.camera && this.model) {
      this.updateCameraPosition();
      this.controls.reset();
    }
  }

  toggleAutoRotate(): void {
    this.videoSettings.enableAutoRotate = !this.videoSettings.enableAutoRotate;
  }
}

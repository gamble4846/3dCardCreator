import { Component, ElementRef, OnInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule, NzIconService } from 'ng-zorro-antd/icon';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  EyeOutline, 
  ReloadOutline, 
  BorderOutline, 
  LinkOutline
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-glb-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzSpinModule,
    NzAlertModule,
    NzIconModule
  ],
  templateUrl: './glb-viewer.component.html',
  styleUrls: ['./glb-viewer.component.css']
})
export class GlbViewerComponent implements OnInit {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;
  
  glbUrl: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private loader!: GLTFLoader;
  public currentModel: THREE.Group | null = null;

  constructor(private iconService: NzIconService) {
    // Register icons
    this.iconService.addIcon(
      EyeOutline, 
      ReloadOutline, 
      BorderOutline, 
      LinkOutline
    );
  }

  ngOnInit() {
    this.initThreeJS();
  }

  private initThreeJS() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.rendererContainer.nativeElement.clientWidth / this.rendererContainer.nativeElement.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      this.rendererContainer.nativeElement.clientWidth,
      this.rendererContainer.nativeElement.clientHeight
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // Add lights
    this.addLights();

    // Add controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Initialize loader
    this.loader = new GLTFLoader();

    // Start animation loop
    this.animate();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private addLights() {
    // Ambient light - much brighter for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    // Main directional light - brighter and positioned for better illumination
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);

    // Additional fill light for better illumination
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-10, -10, 5);
    this.scene.add(fillLight);

    // Top light for extra brightness
    const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
    topLight.position.set(0, 10, 0);
    this.scene.add(topLight);

    // Front light for direct illumination
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.0);
    frontLight.position.set(0, 0, 10);
    this.scene.add(frontLight);

    // Point light for additional ambient illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);
  }

  loadGlbModel() {
    if (!this.glbUrl.trim()) {
      this.errorMessage = 'Please enter a valid GLB URL';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Remove previous model if exists
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.currentModel = null;
    }

    this.loader.load(
      this.glbUrl,
      (gltf) => {
        this.currentModel = gltf.scene;
        
        // Enable shadows for all meshes
        this.currentModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Improve material properties for better visibility
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.metalness = 0.1;
                    mat.roughness = 0.8;
                    mat.envMapIntensity = 1.0;
                  }
                });
              } else if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.metalness = 0.1;
                child.material.roughness = 0.8;
                child.material.envMapIntensity = 1.0;
              }
            }
          }
        });

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(this.currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        this.currentModel.scale.setScalar(scale);
        
        this.currentModel.position.sub(center.multiplyScalar(scale));
        
        this.scene.add(this.currentModel);
        
        // Reset camera position
        this.camera.position.set(0, 0, 5);
        this.controls.reset();
        
        this.isLoading = false;
      },
      (progress) => {
        // Progress callback
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading GLB:', error);
        this.errorMessage = 'Failed to load GLB file. Please check the URL and try again.';
        this.isLoading = false;
      }
    );
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  resetCamera() {
    this.camera.position.set(0, 0, 5);
    this.controls.reset();
  }

  toggleWireframe() {
    if (this.currentModel) {
      this.currentModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.wireframe = !child.material.wireframe;
        }
      });
    }
  }
} 
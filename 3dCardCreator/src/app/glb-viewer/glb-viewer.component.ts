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
  LinkOutline,
  DeleteOutline,
  AppstoreOutline,
  UserOutline,
  LeftOutline,
  RightOutline
} from '@ant-design/icons-angular/icons';

interface LoadedModel {
  group: THREE.Group;
  url: string;
  position: THREE.Vector3;
  originalPosition: THREE.Vector3;
}

type ViewMode = 'all' | 'individual';

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
  viewMode: ViewMode = 'all';
  currentModelIndex: number = 0;
  
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private loader!: GLTFLoader;
  public currentModels: LoadedModel[] = [];

  constructor(private iconService: NzIconService) {
    // Register icons
    this.iconService.addIcon(
      EyeOutline, 
      ReloadOutline, 
      BorderOutline, 
      LinkOutline,
      DeleteOutline,
      AppstoreOutline,
      UserOutline,
      LeftOutline,
      RightOutline
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

  loadGlbModels() {
    if (!this.glbUrl.trim()) {
      this.errorMessage = 'Please enter valid GLB URLs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Clear existing models
    this.clearAllModels();

    // Split URLs by comma and trim whitespace
    const urls = this.glbUrl.split(',').map(url => url.trim()).filter(url => url.length > 0);

    if (urls.length === 0) {
      this.errorMessage = 'Please enter at least one valid GLB URL';
      this.isLoading = false;
      return;
    }

    // Calculate positions for multiple models
    const positions = this.calculateModelPositions(urls.length);

    // Load all models
    let loadedCount = 0;
    let errorCount = 0;

    urls.forEach((url, index) => {
      this.loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          
          // Enable shadows for all meshes
          model.traverse((child) => {
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
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.5 / maxDim; // Smaller scale for multiple models
          model.scale.setScalar(scale);
          
          model.position.sub(center.multiplyScalar(scale));
          
          // Position the model
          model.position.add(positions[index]);
          
          this.scene.add(model);
          
          // Add to current models array
          this.currentModels.push({
            group: model,
            url: url,
            position: positions[index].clone(),
            originalPosition: positions[index].clone()
          });
          
          loadedCount++;
          
          // Check if all models are loaded
          if (loadedCount + errorCount === urls.length) {
            this.isLoading = false;
            if (errorCount > 0) {
              this.errorMessage = `Failed to load ${errorCount} model(s). ${loadedCount} model(s) loaded successfully.`;
            }
            
            // Reset view mode and index
            this.viewMode = 'all';
            this.currentModelIndex = 0;
            
            // Adjust camera to fit all models
            this.fitCameraToModels();
          }
        },
        (progress) => {
          // Progress callback
          console.log(`Loading progress for ${url}:`, (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('Error loading GLB:', error);
          errorCount++;
          
          // Check if all models are processed
          if (loadedCount + errorCount === urls.length) {
            this.isLoading = false;
            if (loadedCount === 0) {
              this.errorMessage = 'Failed to load all GLB files. Please check the URLs and try again.';
            } else {
              this.errorMessage = `Failed to load ${errorCount} model(s). ${loadedCount} model(s) loaded successfully.`;
            }
            
            if (loadedCount > 0) {
              this.fitCameraToModels();
            }
          }
        }
      );
    });
  }

  private calculateModelPositions(count: number): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    
    if (count === 1) {
      positions.push(new THREE.Vector3(0, 0, 0));
    } else if (count === 2) {
      positions.push(new THREE.Vector3(-2, 0, 0));
      positions.push(new THREE.Vector3(2, 0, 0));
    } else if (count === 3) {
      positions.push(new THREE.Vector3(-2, 0, 0));
      positions.push(new THREE.Vector3(0, 0, 0));
      positions.push(new THREE.Vector3(2, 0, 0));
    } else if (count === 4) {
      positions.push(new THREE.Vector3(-2, 1, 0));
      positions.push(new THREE.Vector3(2, 1, 0));
      positions.push(new THREE.Vector3(-2, -1, 0));
      positions.push(new THREE.Vector3(2, -1, 0));
    } else {
      // For more than 4 models, arrange in a grid
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const spacing = 2.5;
      
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = (col - (cols - 1) / 2) * spacing;
        const y = ((rows - 1) / 2 - row) * spacing;
        positions.push(new THREE.Vector3(x, y, 0));
      }
    }
    
    return positions;
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
    
    if (mode === 'all') {
      // Show all models in their original positions
      this.currentModels.forEach((model, index) => {
        model.group.position.copy(model.originalPosition);
        model.group.visible = true;
      });
      this.fitCameraToModels();
    } else {
      // Show only the current model centered
      this.showIndividualModel();
    }
  }

  showIndividualModel() {
    if (this.currentModels.length === 0) return;
    
    // Hide all models
    this.currentModels.forEach(model => {
      model.group.visible = false;
    });
    
    // Show only the current model
    const currentModel = this.currentModels[this.currentModelIndex];
    currentModel.group.visible = true;
    currentModel.group.position.set(0, 0, 0);
    
    // Fit camera to the individual model
    this.fitCameraToModel(currentModel.group);
  }

  nextModel() {
    if (this.currentModelIndex < this.currentModels.length - 1) {
      this.currentModelIndex++;
      this.showIndividualModel();
    }
  }

  previousModel() {
    if (this.currentModelIndex > 0) {
      this.currentModelIndex--;
      this.showIndividualModel();
    }
  }

  private fitCameraToModels() {
    if (this.currentModels.length === 0) return;

    // Calculate bounding box of all visible models
    const box = new THREE.Box3();
    this.currentModels.forEach(model => {
      if (model.group.visible) {
        box.expandByObject(model.group);
      }
    });

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2; // Adjust this multiplier as needed

    // Position camera
    this.camera.position.set(center.x, center.y, center.z + distance);
    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();
  }

  private fitCameraToModel(model: THREE.Group) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5; // Closer view for individual models

    // Position camera
    this.camera.position.set(center.x, center.y, center.z + distance);
    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();
  }

  getModelsInfoMessage(): string {
    if (this.viewMode === 'individual' && this.currentModels.length > 1) {
      const currentModel = this.currentModels[this.currentModelIndex];
      const urlParts = currentModel.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      return `Viewing model ${this.currentModelIndex + 1} of ${this.currentModels.length}: ${fileName}`;
    } else {
      return `Loaded ${this.currentModels.length} model(s)`;
    }
  }

  clearAllModels() {
    // Remove all models from scene
    this.currentModels.forEach(model => {
      this.scene.remove(model.group);
    });
    
    // Clear the array
    this.currentModels = [];
    
    // Reset view mode and index
    this.viewMode = 'all';
    this.currentModelIndex = 0;
    
    // Reset camera
    this.camera.position.set(0, 0, 5);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
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
    if (this.currentModels.length > 0) {
      if (this.viewMode === 'individual') {
        this.showIndividualModel();
      } else {
        this.fitCameraToModels();
      }
    } else {
      this.camera.position.set(0, 0, 5);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  toggleWireframe() {
    this.currentModels.forEach(model => {
      if (model.group.visible) {
        model.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material.wireframe = !child.material.wireframe;
          }
        });
      }
    });
  }
} 
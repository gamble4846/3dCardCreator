import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule, NzIconService } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { 
  UploadOutline, 
  ReloadOutline, 
  DownloadOutline, 
  ZoomInOutline, 
  ZoomOutOutline, 
  FullscreenOutline 
} from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-card-creator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzUploadModule,
    NzInputModule,
    NzFormModule,
    NzIconModule,
    NzSpinModule,
    NzInputNumberModule
  ],
  templateUrl: './card-creator.component.html',
  styleUrls: ['./card-creator.component.css']
})
export class CardCreatorComponent implements OnInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

  title = '3D Card Generator';

  // Three.js properties
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private card!: THREE.Mesh;
  private animationId!: number;

  // File properties
  frontImage: File | null = null;
  backImage: File | null = null;
  frontImageUrl: string = '';
  backImageUrl: string = '';

  // Card dimensions (in pixels - will be converted to Three.js units)
  cardWidth: number = 1080;   // Width in pixels
  cardHeight: number = 1920;  // Height in pixels
  cardThickness: number = 10;  // Thickness in pixels

  // Camera zoom properties
  private minZoom: number = 0.5;
  private maxZoom: number = 20;
  private currentZoom: number = 5;

  // UI properties
  isLoading = false;
  isExporting = false;

  constructor(
    private message: NzMessageService,
    private iconService: NzIconService
  ) {
    // Register icons
    this.iconService.addIcon(
      UploadOutline, 
      ReloadOutline, 
      DownloadOutline, 
      ZoomInOutline, 
      ZoomOutOutline, 
      FullscreenOutline
    );
  }

  ngOnInit() {
    this.initThreeJS();
    this.createCard();
    this.animate();
    this.fitCardToScreen(); // Ensure card fits to screen on init
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThreeJS() {
    const container = this.rendererContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, this.currentZoom);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Lighting - Much brighter setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Add additional fill light for better illumination
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-5, -5, 5);
    this.scene.add(fillLight);

    // Add top light for extra brightness
    const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
    topLight.position.set(0, 10, 0);
    this.scene.add(topLight);

    // Add front light for direct illumination
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.0);
    frontLight.position.set(0, 0, 10);
    this.scene.add(frontLight);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Handle mouse wheel for zooming
    container.addEventListener('wheel', (event: any) => this.onMouseWheel(event));
  }

  private onMouseWheel(event: WheelEvent) {
    event.preventDefault();

    const zoomSpeed = 0.5; // Increased from 0.1 to 0.5 for faster zooming
    const delta = event.deltaY > 0 ? 1 : -1;

    this.currentZoom += delta * zoomSpeed;
    this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.currentZoom));

    this.camera.position.z = this.currentZoom;
  }

  zoomIn() {
    this.currentZoom = Math.min(this.maxZoom, this.currentZoom + 1);
    this.camera.position.z = this.currentZoom;
  }

  zoomOut() {
    this.currentZoom = Math.max(this.minZoom, this.currentZoom - 1);
    this.camera.position.z = this.currentZoom;
  }

  resetZoom() {
    this.currentZoom = 5;
    this.camera.position.z = this.currentZoom;
  }

  fitCardToScreen() {
    if (!this.card) return;

    // Get the card's bounding box
    const box = new THREE.Box3().setFromObject(this.card);
    const size = box.getSize(new THREE.Vector3());

    // Calculate the maximum dimension
    const maxDimension = Math.max(size.x, size.y, size.z);

    // Calculate the required zoom to fit the card
    // Add some padding (1.5x) to ensure the card fits comfortably
    const requiredZoom = maxDimension * 1.5;

    // Set the zoom within our limits
    this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, requiredZoom));
    this.camera.position.z = this.currentZoom;
  }

  private createCard() {
    // Remove existing card if it exists
    if (this.card) {
      this.scene.remove(this.card);
    }

    // Convert pixels to Three.js units (divide by 100 for reasonable scale)
    const widthInUnits = this.cardWidth / 100;
    const heightInUnits = this.cardHeight / 100;
    const thicknessInUnits = this.cardThickness / 100;

    // Card geometry (vertical orientation)
    const geometry = new THREE.BoxGeometry(widthInUnits, heightInUnits, thicknessInUnits);

    // Default material (will be replaced with textures)
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      metalness: 0.0,
      roughness: 0.3,
      envMapIntensity: 1.0
    });

    this.card = new THREE.Mesh(geometry, material);
    this.card.castShadow = true;
    this.card.receiveShadow = true;
    this.scene.add(this.card);
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Rotate the card slowly
    if (this.card) {
      this.card.rotation.y += 0.01;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    const container = this.rendererContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onFrontImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.frontImage = file;
      this.frontImageUrl = URL.createObjectURL(file);
      this.updateCardTexture();
    }
  }

  onBackImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.backImage = file;
      this.backImageUrl = URL.createObjectURL(file);
      this.updateCardTexture();
    }
  }

  onDimensionsChange() {
    console.log('Dimensions changed:', { width: this.cardWidth, height: this.cardHeight, thickness: this.cardThickness });
    // Recreate card with new dimensions
    this.createCard();
    this.updateCardTexture();
    // Auto-fit the card to screen after a short delay to ensure the card is created
    setTimeout(() => this.fitCardToScreen(), 100);
  }

  private updateCardTexture() {
    if (!this.card) return;

    const loader = new THREE.TextureLoader();
    
    // Create materials for front and back faces
    const materials: THREE.Material[] = [];
    
    // For a vertical card (BoxGeometry), the faces are:
    // 0: right face (positive X)
    // 1: left face (negative X) 
    // 2: top face (positive Y)
    // 3: bottom face (negative Y)
    // 4: front face (positive Z) - this is what we want for front image
    // 5: back face (negative Z) - this is what we want for back image
    
    for (let i = 0; i < 6; i++) {
      let material: THREE.Material;
      
      if (i === 4) { // Front face (positive Z)
        if (this.frontImageUrl) {
          const texture = loader.load(this.frontImageUrl);
          material = new THREE.MeshStandardMaterial({ 
            map: texture,
            metalness: 0.0,
            roughness: 0.3,
            envMapIntensity: 1.0
          });
        } else {
          material = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            metalness: 0.0,
            roughness: 0.3,
            envMapIntensity: 1.0
          });
        }
      } else if (i === 5) { // Back face (negative Z)
        if (this.backImageUrl) {
          const texture = loader.load(this.backImageUrl);
          material = new THREE.MeshStandardMaterial({ 
            map: texture,
            metalness: 0.0,
            roughness: 0.3,
            envMapIntensity: 1.0
          });
        } else {
          material = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            metalness: 0.0,
            roughness: 0.3,
            envMapIntensity: 1.0
          });
        }
      } else { // Side faces (0,1,2,3)
        material = new THREE.MeshStandardMaterial({ 
          color: 0x888888,
          metalness: 0.0,
          roughness: 0.3,
          envMapIntensity: 1.0
        });
      }
      
      materials.push(material);
    }
    
    // Apply materials to the card
    this.card.material = materials;
  }

  async exportGLB() {
    if (!this.card) {
      this.message.error('No card to export');
      return;
    }

    this.isExporting = true;

    try {
      const exporter = new GLTFExporter();

      const result = await new Promise<any>((resolve, reject) => {
        exporter.parse(
          this.card,
          (gltf) => resolve(gltf),
          (error) => reject(error),
          { binary: true }
        );
      });

      // Create download link
      const blob = new Blob([result], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '3d-card.glb';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.message.success('3D card exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      this.message.error('Failed to export 3D card');
    } finally {
      this.isExporting = false;
    }
  }
} 
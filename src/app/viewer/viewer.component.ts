import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-viewer',
  standalone: true,
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.bootstrap();
  }

  async bootstrap() {
    const [{ WebGLRenderer, Scene, Color, PerspectiveCamera, HemisphereLight, DirectionalLight, GridHelper, Group, Box3, Vector2, Vector3, Raycaster },
      { OrbitControls }, { GLTFLoader }] = await Promise.all([
      import('three'),
      import('three/examples/jsm/controls/OrbitControls.js'),
      import('three/examples/jsm/loaders/GLTFLoader.js')
    ]);

    const canvas = this.canvasRef.nativeElement;
    const renderer = new WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new Scene();
    scene.background = new Color(0x111111);

    const camera = new PerspectiveCamera(45, 2, 0.1, 1000);
    camera.position.set(0, 1.6, 3.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.2, 0);
    controls.enableDamping = true;

    const hemi = new HemisphereLight(0xffffff, 0x222233, 0.6);
    scene.add(hemi);
    const key = new DirectionalLight(0xffffff, 1.0); key.position.set(3, 5, 2); scene.add(key);
    const fill = new DirectionalLight(0xffffff, 0.5); fill.position.set(-3, 2, -2); scene.add(fill);

    const grid = new GridHelper(10, 10, 0x222222 as any, 0x222222 as any);
    grid.position.y = 0; scene.add(grid);

    const rootGroup = new Group(); scene.add(rootGroup);

    const resize = () => {
      const parent = canvas.parentElement!;
      const rect = parent.getBoundingClientRect();
      const width = rect.width, height = rect.height;
      if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };
    this.resizeObserver = new ResizeObserver(resize);
    this.resizeObserver.observe(canvas.parentElement!);
    window.addEventListener('resize', resize);
    resize();

    const fitToObject = (object: any) => {
      const box = new Box3().setFromObject(object);
      const size = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
      camera.position.set(center.x, center.y + maxDim * 0.1, center.z + cameraZ * 0.6);
      controls.target.copy(center);
      controls.update();
    };

    const layersDiv = document.getElementById('layers')!;
    const selectionDiv = document.getElementById('selection')!;
    const infoDiv = document.getElementById('info')!;

    const buildLayerUI = (group: any) => {
      layersDiv.innerHTML = '';
      const topGroups = group.children.filter((c: any) => c.type === 'Group' || c.type === 'Object3D');
      if (topGroups.length === 0) {
        const row = document.createElement('div'); row.className = 'row';
        const label = document.createElement('label'); label.textContent = 'Whole model';
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = true;
        cb.addEventListener('change', () => { group.visible = cb.checked; });
        row.appendChild(cb); row.appendChild(label); layersDiv.appendChild(row);
        return;
      }
      for (const g of topGroups) {
        const row = document.createElement('div'); row.className = 'row';
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = true;
        cb.addEventListener('change', () => { g.visible = cb.checked; });
        const label = document.createElement('label'); label.textContent = g.name || 'Group';
        row.appendChild(cb); row.appendChild(label); layersDiv.appendChild(row);
      }
    };

    const collectPickMeshes = (object: any) => {
      const meshes: any[] = [];
      object.traverse((o: any) => { if (o.isMesh) meshes.push(o); });
      return meshes;
    };

  const loader = new GLTFLoader();
    let currentPickMeshes: any[] = [];

    const loadFromArrayBuffer = async (arrayBuffer: ArrayBuffer) => new Promise<any>((resolve, reject) => {
      loader.parse(arrayBuffer as any, '', (gltf: any) => resolve(gltf), (e: any) => reject(e));
    });

    const loadUrl = async (url: string) => {
      clearScene();
      const gltf = await loader.loadAsync(url);
      rootGroup.add(gltf.scene);
      fitToObject(gltf.scene);
      buildLayerUI(gltf.scene);
      currentPickMeshes = collectPickMeshes(gltf.scene);
    };

    const clearScene = () => {
      while (rootGroup.children.length) rootGroup.remove(rootGroup.children[0]);
      layersDiv.innerHTML = '';
      selectionDiv.textContent = 'Nothing selected';
    };

    // Inputs
    const fileInput = document.getElementById('file') as HTMLInputElement;
    fileInput.addEventListener('change', async (e: any) => {
      const file = e.target.files?.[0]; if (!file) return;
      const buf = await file.arrayBuffer();
      clearScene();
      const gltf = await loadFromArrayBuffer(buf);
      rootGroup.add(gltf.scene);
      fitToObject(gltf.scene);
      buildLayerUI(gltf.scene);
      currentPickMeshes = collectPickMeshes(gltf.scene);
    });

    const urlInput = document.getElementById('url') as HTMLInputElement;
    document.getElementById('loadUrl')!.addEventListener('click', async () => {
      const url = urlInput.value.trim(); if (!url) return;
      await loadUrl(url);
    });

    document.getElementById('reset')!.addEventListener('click', () => {
      fitToObject(rootGroup);
    });

    // Picking
  const raycaster = new Raycaster();
  const mouse = new Vector2();
    let lastEmissiveMat: any = null;
    const lastEmissiveColor = new Color();

    const onPick = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  (raycaster as any).setFromCamera({ x: mouse.x, y: mouse.y }, camera);
      const hits = (raycaster as any).intersectObjects(currentPickMeshes, true);
      if (lastEmissiveMat) { lastEmissiveMat.emissive.copy(lastEmissiveColor); lastEmissiveMat = null; }
      if (hits.length) {
        const m = hits[0].object;
        if ((m as any).material && (m as any).material.emissive) {
          lastEmissiveMat = (m as any).material;
          lastEmissiveColor.copy(lastEmissiveMat.emissive);
          lastEmissiveMat.emissive.setRGB(0.2, 0.2, 0.4);
        }
        const path: string[] = [];
        let p: any = m;
        while (p) { path.push(p.name || p.type); p = p.parent; }
        selectionDiv.textContent = (m as any).name ? `${(m as any).name}` : 'Mesh';
        infoDiv.textContent = `Selected ${(m as any).name || 'Mesh'} path ${path.slice(0, 4).join(' > ')}`;
      } else {
        selectionDiv.textContent = 'Nothing selected';
        infoDiv.textContent = 'Click a mesh to see its name. Toggle layers at left.';
      }
    };
    renderer.domElement.addEventListener('pointerdown', (e: PointerEvent) => onPick(e.clientX, e.clientY));

    // Fallback demo parts
    const makeFallback = async () => {
      const { MeshStandardMaterial, Mesh, SphereGeometry, CapsuleGeometry, CylinderGeometry } = await import('three');
      const group = new Group();
      const matSkin = new MeshStandardMaterial({ color: 0xf0c8a0, metalness: 0, roughness: 1 });
      const matMuscle = new MeshStandardMaterial({ color: 0xaa4444, metalness: 0, roughness: 1 });
      const matBone = new MeshStandardMaterial({ color: 0xeeeeee, metalness: 0, roughness: 1 });
      const skin = new Group(); (skin as any).name = 'Skin';
      const muscles = new Group(); (muscles as any).name = 'Muscles';
      const skeleton = new Group(); (skeleton as any).name = 'Skeleton';
      const head = new Mesh(new SphereGeometry(0.12, 32, 32), matSkin); (head as any).position.y = 1.7; (head as any).name = 'Head'; skin.add(head);
      const torso = new Mesh(new CapsuleGeometry(0.18, 0.5, 8, 20), matSkin); (torso as any).position.y = 1.3; (torso as any).name = 'Torso'; skin.add(torso);
      const femur = new Mesh(new CylinderGeometry(0.03, 0.03, 0.4, 24), matBone); (femur as any).position.set(0.1, 0.7, 0); (femur as any).name = 'Femur'; skeleton.add(femur);
      const bicep: any = new (CapsuleGeometry as any)(0.06, 0.22, 8, 16);
      const bicepMesh = new Mesh(bicep, matMuscle); (bicepMesh as any).position.set(0.25, 1.25, 0); (bicepMesh as any).rotation.z = Math.PI * 0.15; (bicepMesh as any).name = 'Biceps'; muscles.add(bicepMesh);
      group.add(skin, muscles, skeleton);
      return group;
    };

    const demo = await makeFallback();
    rootGroup.add(demo);
    fitToObject(demo);
    buildLayerUI(demo);
    currentPickMeshes = collectPickMeshes(demo);

    const animate = () => {
      resize();
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}

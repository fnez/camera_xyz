import "./style.css";
import { Scene, PerspectiveCamera, WebGLRenderer, Group } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const cameraImageContainer = document.querySelector("div.cameraImageContainer");
const loaderTag = document.querySelector("div.loader");
const header = document.querySelector("header");

let gltfLoader;
let controls;
let currentEffect = 0;
let aimEffect = 0;
let timeoutEffect;

const canvasWidth = 800;
const canvasHeight = 600;

// ThreeJS Scene
const scene = new Scene();
const camera = new PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);

const renderer = new WebGLRenderer();
renderer.setSize(canvasWidth, canvasHeight);
renderer.setClearColor(0x000000, 0);
cameraImageContainer.appendChild(renderer.domElement);

const loadLights = async () => {
  const { DirectionalLight, AmbientLight } = await import("three");

  const ambience = new AmbientLight(0x404040);
  scene.add(ambience);

  const keyLight = new DirectionalLight(0xffffff, 1);
  keyLight.position.set(-1, 1, 3);
  scene.add(keyLight);

  const fillLight = new DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(1, 1, 3);
  scene.add(fillLight);

  const backLight = new DirectionalLight(0xffffff, 1);
  backLight.position.set(-1, 3, -1);
  scene.add(backLight);
};

// Lighting
loadLights();

const add3dObject = async () => {
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const { DRACOLoader } = await import(
    "three/examples/jsm/loaders/DRACOLoader.js"
  );

  // Object Import
  gltfLoader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();

  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
  gltfLoader.setDRACOLoader(dracoLoader);
};

add3dObject();

const loadGroup = new Group();
const scrollGroup = new Group();
scrollGroup.add(loadGroup);

scene.add(scrollGroup);

const addAnimation = async () => {
  const { animate, inView } = await import("motion");

  animate("section.content p, section.content img", { opacity: 0 });
  inView("section.content", (element) => {
    animate(
      element.querySelectorAll("p,img"),
      { opacity: 1 },
      { duration: 1, delay: 1 }
    );
  });

  animate("header", { y: -100, opacity: 0 });
  animate("div.logo", { y: -100, opacity: 0 });

  add3dObject().then(() => {
    gltfLoader.load(
      "zenit_6_camera_v2.glb",
      (gtlf) => {
        let model = gtlf.scene;

        const scale = Math.min(window.innerWidth, window.innerHeight) / 800;
        model.scale.set(scale, scale, scale);
        loadGroup.add(model);

        animate(
          "header",
          {
            y: [-100, 0],
            opacity: [0, 1],
          },
          { duration: 1, delay: 2.5 }
        );

        animate(
          "div.logo",
          {
            y: [-100, 0],
            opacity: [0, 1],
          },
          { duration: 1, delay: 2 }
        );

        animate(
          "div.loader",
          {
            y: "-100%",
          },
          { duration: 1, delay: 1 }
        );
      },
      (xhr) => {
        const percentage = Math.round((xhr.loaded / xhr.total) * 100);
        loaderTag.querySelector("span").innerHTML = `${percentage} %`;
      },
      (error) => {
        console.error(error);
      }
    );
  });
};

addAnimation();

const addControls = async () => {
  const { OrbitControls } = await import(
    "three/addons/controls/OrbitControls.js"
  );

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 2;
  controls.update();
};

addControls();

camera.position.z = 0.32;

// Post-Processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// Render
const render = () => {
  controls.update();
  scrollGroup.rotation.set(0, window.scrollY * 0.001, 0);
  currentEffect += (aimEffect - currentEffect) * 0.08;

  requestAnimationFrame(render);
  composer.render();
};

const resize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;

  renderer.setSize(canvasWidth, canvasHeight);
};

const timing = () => {
  clearTimeout(timeoutEffect);
  aimEffect = 1;

  timeoutEffect = setTimeout(() => {
    aimEffect = 0;
  }, 300);
};

const scroll = () => {
  timing();
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
};

addControls().then(() => {
  render();
});

window.addEventListener("resize", resize);
window.addEventListener("scroll", scroll);

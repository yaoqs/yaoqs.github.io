"use strict";
import * as THREE from "three";
const demo_cube_rot = {
        canvasContainer: null,
        cwidth: null,
        cheight: null,
        renderer: null,
        canvas: null,
        scene: null,
        camera: null,
        geometry: null,
        material: null,
        cube: null,
        clock: null,
        init(id) {
                try {
                        this.canvasContainer = document.getElementById(id);
                        if (!this.canvasContainer) {
                                throw new Error(`Element with id '${id}' not found.`);
                        }
                } catch (error) {
                        console.error(error.message);
                        return;
                }
                this.cwidth = this.canvasContainer.clientWidth; //获取画布的宽
                this.cheight = this.canvasContainer.clientHeight; //获取画布的高
                this.renderer = new THREE.WebGLRenderer({
                        antialias: true, //抗锯齿开
                        alpha: true, // canvas是否包含alpha (透明度) 默认为 false
                        precision: "highp",
                });
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.renderer.setSize(this.cwidth, this.cheight); //设置渲染器的宽和高
                this.renderer.setClearColor(0x000000); //设置渲染器的背景颜色为黑色
                this.renderer.setClearAlpha(0.0); // 设置alpha，合法参数是一个 0.0 到 1.0 之间的浮点数
                this.canvas = this.renderer.domElement; //获取渲染器的画布元素
                this.canvasContainer.appendChild(this.canvas); //将画布写入html元素中
                this.scene = new THREE.Scene();
                const fov = 40; // 视野范围
                const aspect = this.cwidth / this.cheight; // 相机宽高比
                const near = 0.1; // 近平面
                const far = 10000; // 远平面
                //this.camera = new THREE.OrthographicCamera(-6, 6, 4.5, -4.5, 0, 50); //创建照相机
                this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
                this.camera.position.set(35, 15, 25); //设置照相机的位置
                this.camera.lookAt(new THREE.Vector3(0, 0, 0)); //设置照相机面向(0,0,0)坐标观察照相机默认坐标为(0,0,0);默认面向为沿z轴向里观察;
                const LIGHT_POSITION = { x: 12, y: 15, z: 10 };
                var light = new THREE.PointLight(0xffffff, 1, 100); //创建光源
                light.position.set(LIGHT_POSITION.x, LIGHT_POSITION.y, LIGHT_POSITION.z); //设置光源的位置
                this.scene.add(light); //在场景中添加光源
                // 顶点着色器
                const vertexShader = `
                        varying vec2 vUv;
                        varying vec3 vPosition;

                        void main(){
                        gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);

                        vUv=uv;
                        vPosition=position;
                        }
                        `;
                // 片元着色器
                const fragmentShader = `
                        precision mediump int;
                        precision highp float;

                        uniform float uTime;
                        varying vec2 vUv;
                        uniform vec3 u_resolution;
                        varying vec3 vPosition;

                        void main(){
                        vec3 topleft = vec3( 2.5,2.5,2.5 );
                        vec3 bottomright=vec3(-2.5,-2.5,-2.5);
                        float dist=  distance(topleft,bottomright);

                        float r = vPosition.x/dist+0.5;
                        float g = vPosition.y/dist+0.5;
                        float b = vPosition.z/dist+0.5;
                        gl_FragColor = vec4(r, g, b, 1);

                        }
                        `;
                this.geometry = new THREE.BoxGeometry(5, 5, 5);

                this.material = new THREE.ShaderMaterial({
                        vertexShader: vertexShader,
                        fragmentShader: fragmentShader,
                        side: THREE.DoubleSide,
                        uniforms: {
                                uTime: {
                                        value: 0,
                                },
                                ratio: {
                                        value: 0,
                                },
                        },
                });
                //创建形状和材质之后，就可以创建该物体了：
                //创建物体
                this.cube = new THREE.Mesh(this.geometry, this.material);
                this.scene.add(this.cube);
                this.renderer.render(this.scene, this.camera);

                // Clock
                this.clock = new THREE.Clock();
                // 在init方法中初始化ratio
                this.material.uniforms.ratio = {
                        value: 0,
                };
        },
        play() {
                // Animations
                const tick = () => {
                        // stats.begin()

                        const elapsedTime = this.clock.getElapsedTime();
                        // 动画逻辑
                        this.cube.position.y = Math.sin(elapsedTime);
                        this.cube.position.x = Math.cos(elapsedTime);
                        this.cube.rotation.y += 0.01;
                        this.cube.rotation.x += 0.01;

                        //material.color.set(100,100,100)
                        //material.uniforms.uTime.value+=0.01
                        // 在play方法中修改ratio的更新方式
                        // 更新材质uniform值
                        this.material.uniforms.ratio.value =
                                (this.material.uniforms.ratio.value + 10) % 100;

                        // Render
                        this.renderer.render(this.scene, this.camera);
                        // 请求下一帧
                        requestAnimationFrame(tick);
                };
                // 当页面可见时开始动画，不可见时暂停
                document.addEventListener("visibilitychange", () => {
                        if (document.visibilityState === "visible") {
                                tick();
                        }
                });

                // 首次启动动画
                tick();
        },
};

demo_cube_rot.init("mainCanvas");
demo_cube_rot.play();
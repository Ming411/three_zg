import React, {useEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import {Button} from 'antd';
import {HomeOutlined} from '@ant-design/icons';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
// import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer';
// import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass';
// import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass';
// import {CopyShader} from 'three/examples/jsm/shaders/CopyShader';
// import {BloomPass} from 'three/examples/jsm/postprocessing/BloomPass';
// import {FilmPass} from 'three/examples/jsm/postprocessing/FilmPass';
// import {DotScreenPass} from 'three/examples/jsm/postprocessing/DotScreenPass';
// import {TexturePass} from 'three/examples/jsm/postprocessing/TexturePass';
import {TWEEN} from 'three/examples/jsm/libs/tween.module.min.js';

const DemoBox = styled.div`
  width: 100%;
  height: 100%;
  .home {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 999;
  }
`;

let canvas, scene, camera, controls, renderer, gltfScene, selectGltfScene;
const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
let textureLoader = new THREE.TextureLoader();
// 创建一个 FileLoader
const fileLoader = new THREE.FileLoader();
const provienceArr = ['广西', '贵州', '重庆', '湖北', '江西', '安徽', '浙江', '河北'];
// 镜头移动
const moveTo = (insPos, desPos, esFn, time = 1000, cb) => {
  new TWEEN.Tween(insPos)
    .to(desPos, time)
    .easing(esFn)
    .start()
    .onComplete(() => {
      cb && cb();
    });
};
//投影坐标转3D坐标
const to3dMapPoint3 = (longitude, dimension) => {
  let x0 =
    longitude * 0.0000019299020627285593 + dimension * 1.5468892360976155e-15 + -18.715482236925332;
  let x1 =
    longitude * -9.603095107696147e-9 + dimension * -0.000001930008759831441 + 6.7177753280436185;
  return [x0, 0.4, x1 - 0.04];
  // 0.4 为y轴高度
};
let roadData = null,
  lineTexture = null;

function EarthDemo() {
  console.log('组件更新了~');
  const canvasRefs = useRef(null);

  // const [roadData, setRoadData] = useState([]);
  // const [lineTexture, setLineTexture] = useState(null);
  const [orangeLz, setOrangeLz] = useState(null);
  const [blueLz, setBlueLz] = useState(null);
  const [orangePoint, setOrangePoint] = useState(null);
  const [bluePoint, setBluePoint] = useState(null);
  const [curveObjectArr, setCurveObjectArr] = useState([]);
  // let curveObjectArr = []; // 用于后续清除管道线
  useEffect(() => {
    fileLoader.load('./static/road.json', data => {
      // setRoadData(JSON.parse(data).features);
      roadData = JSON.parse(data).features;
    });
    // 路线贴图
    lineTexture = textureLoader.load('/static/resource/img/route.png', texture => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1); //贴图x,y平铺数量
    });
    canvas = canvasRefs.current;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-1.1803, 9.6773, 5.7381);
    camera.lookAt(0, 0, 0);
    scene.add(camera);
    /* 天空盒 */
    const url = './static/resource/sky/dark-s_';
    const textureCube = cubeTextureLoader.load([
      url + 'px.jpg',
      url + 'nx.jpg',
      url + 'py.jpg',
      url + 'ny.jpg',
      url + 'pz.jpg',
      url + 'nz.jpg'
    ]);
    // 将使用sRGB编码格式，以确保正确的颜色显示。
    textureCube.encoding = THREE.sRGBEncoding;
    scene.background = textureCube;
    /* 辅助坐标轴 */
    // const AxesHelper = new THREE.AxesHelper(4);
    // scene.add(AxesHelper);
    /* 导入模型 */
    gltfLoader.load('./static/model/scene.glb', function (gltf) {
      // console.log(gltf);
      gltfScene = gltf.scene;
      gltfScene.visible = true;
      scene.add(gltf.scene);
      // gltfScene.getObjectByName('圆柱').traverse(child => {
      //   child.position.y = 1;
      // });
      // gltfScene.getObjectByName('圆柱').position.y = 1;
    });
    gltfLoader.load('./static/selectModel/scene.glb', function (gltf) {
      // console.log(gltf, 'nei');
      selectGltfScene = gltf.scene;
      selectGltfScene.visible = false;
      scene.add(selectGltfScene);
    });
    /* 镜头控制器 */
    controls = new OrbitControls(camera, canvas);
    controls.maxPolarAngle = 1.5; //上下两极的可视区域的最大角度
    controls.minPolarAngle = 0.5; //上下两极的可视区域最小角度
    controls.enableDamping = true; //允许远近拉伸
    controls.enableKeys = false; //是否允许键盘控制
    controls.enablePan = true; //是否允许平移
    controls.dampingFactor = 0.1; //鼠标滚动一个单位时拉伸幅度
    controls.rotateSpeed = 0.1; //旋转速度
    // // controls.enabled = false;//禁用控制器
    controls.minDistance = 1; //离中心物体的最近距离
    controls.maxDistance = 10; //离中心物体的最远距离
    controls.update(); //控制器实时更新
    controls.target.set(0, 0, 0);
    /* 灯光 */
    const light = new THREE.AmbientLight(0x404040, 1); // 环境光
    scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 平行光
    scene.add(directionalLight);
    /* 渲染器 */
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false, //抗锯齿
      precision: 'mediump', //着色精度选择"highp", "mediump" 或 "lowp"
      alpha: true, //是否可以设置背景色透明
      logarithmicDepthBuffer: true // 模型重叠共面闪烁
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // 只兼容到最大缩放2
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /* 特效 ====*/

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }, []);
  useEffect(() => {
    let flag;
    const speed = 0.0005;
    let direction = 1; // 1上-1下
    let barDirection = -1;
    // const clock = new THREE.Clock();
    function animate() {
      // const elapsedTime = clock.getElapsedTime();
      controls.update();
      if (lineTexture) {
        lineTexture.offset.x += 0.01;
      }
      if (orangeLz && blueLz) {
        // console.log('~~~~~~~~~~');
        orangeLz.position.y += speed * direction;
        blueLz.position.y += speed * direction;
        if (orangeLz.position.y > 0.5) {
          direction = -1;
        } else if (orangeLz.position.y < 0.41) {
          direction = 1;
        }
      }
      if (orangePoint && bluePoint) {
        orangePoint.rotateOnAxis(new THREE.Vector3(0, 1, 0), speed * 50);
        bluePoint.rotateOnAxis(new THREE.Vector3(0, 1, 0), speed * 50);
      }
      if (gltfScene && gltfScene.visible === true) {
        gltfScene.getObjectByName('圆柱').traverse(child => {
          if (child.isMesh && !child.name.startsWith('光柱')) {
            child.position.y += speed * barDirection;
            if (child.position.y > 0) {
              barDirection = -1;
            } else if (child.position.y < -0.1) {
              barDirection = 1;
            }
          }
        });
        // let barIns = gltfScene.getObjectByName('圆柱');
        // barIns.position.y += speed * barDirection;
        // if (barIns.position.y > 0.4) {
        //   barDirection = -1;
        // } else if (barIns.position.y < 0.3) {
        //   barDirection = 1;
        // }
      }
      TWEEN.update();
      renderer.render(scene, camera);
      flag = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      cancelAnimationFrame(flag);
    };
  }, [orangeLz, blueLz, orangePoint, bluePoint]);

  /* 格式化路线数据，创建管道 */
  const racingLine = arr => {
    let pointArr1 = [];
    arr.forEach(item => {
      pointArr1.push(new THREE.Vector3(item[0], item[1], item[2]));
    });
    const curve = new THREE.CatmullRomCurve3(pointArr1);
    let geometry = new THREE.TubeGeometry(curve, 150, 0.003, 25);
    let material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      map: lineTexture,
      depthTest: true,
      transparent: false
    });
    let curveObject = new THREE.Mesh(geometry, material);
    scene.add(curveObject);
    curveObject.visible = true;
    curveObjectArr.push(curveObject);
    setCurveObjectArr([...curveObjectArr]);
  };
  /* 点击事件 */
  const getMousePosition = event => {
    let containerDiv = canvas.getBoundingClientRect();
    let mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - containerDiv.left) / window.innerWidth) * 2 - 1;
    mouse.y = -((event.clientY - containerDiv.top) / window.innerHeight) * 2 + 1;
    return mouse;
  };
  const handleClick = ev => {
    let mouse = getMousePosition(ev);
    let rayCaster = new THREE.Raycaster();
    rayCaster.setFromCamera(mouse, camera);
    if (gltfScene.userData && gltfScene.userData.clickable === false) {
      return;
    }
    let intersects = rayCaster.intersectObjects(gltfScene.children, true);
    if (intersects.length > 0) {
      let ret = intersects.find(item => {
        return provienceArr.includes(item.object.name.substring(0, 2));
      });
      if (ret !== undefined) {
        // 选中
        let selectName = ret.object.name.substring(0, 2);
        gltfScene.visible = false;
        // 取消点击事件
        gltfScene.userData = {clickable: false};
        selectGltfScene.visible = true;
        selectGltfScene.traverse(child => {
          if (child.isMesh && child.name !== '中国地图底') {
            child.visible = false;
          }
        });
        // 获取当前选中的板块
        let currentIns = scene.getObjectByName(`${selectName}002`);
        currentIns.traverse(child => {
          if (child.isMesh) {
            child.visible = true;
          }
        });
        //相机位置
        moveTo(
          camera.position,
          {
            x: currentIns.position.x,
            y: currentIns.position.y + 1,
            z: currentIns.position.z + 1
          },
          TWEEN.Easing.Quadratic.Out
        );
        // 获取物体的边界框
        const boundingBox = new THREE.Box3().setFromObject(currentIns);
        // 计算物体中心点
        const center = new THREE.Vector3();
        const centerPosition = boundingBox.getCenter(center);
        camera.lookAt(centerPosition.x, centerPosition.y, centerPosition.z);
        //控制器中心点
        moveTo(controls.target, centerPosition, TWEEN.Easing.Quadratic.Out);
        let retRoad = roadData.filter(item => item.properties.city === selectName);
        // console.log(retRoad);
        let retPoints = retRoad.map(item => {
          return item.geometry.coordinates[0].map(items => to3dMapPoint3(...items));
        }); // [[[],[]...],[[],[]...]]

        let orangelzz = scene.getObjectByName(`棱锥橙`);
        setOrangeLz(orangelzz);
        let orangePointt = scene.getObjectByName(`橙色-正`);
        orangePointt.visible = true;
        setOrangePoint(orangePointt);
        let bluelzz = scene.getObjectByName(`棱锥蓝`);
        setBlueLz(bluelzz);
        let bluePointt = scene.getObjectByName(`蓝色-正`);
        bluePointt.visible = true;
        setBluePoint(bluePointt);
        orangelzz.traverse(child => {
          if (child.isMesh) {
            child.visible = true;
          }
        });
        bluelzz.traverse(child => {
          if (child.isMesh) {
            child.visible = true;
          }
        });
        retPoints.forEach(item => {
          orangelzz.position.set(item[0][0], item[0][1], item[0][2]);
          orangePointt.position.copy(orangelzz.position);
          bluelzz.position.set(
            item[item.length - 1][0],
            item[item.length - 1][1],
            item[item.length - 1][2]
          );
          bluePointt.position.copy(bluelzz.position);
          racingLine(item);
        });
      }
    }
  };

  /* home按钮 */
  const homeClick = () => {
    if (gltfScene.visible === true) return;
    gltfScene.visible = true;
    gltfScene.userData = {clickable: true};
    selectGltfScene.visible = false;
    /* 清除之前创建的管道线 */
    if (curveObjectArr.length !== 0) {
      curveObjectArr.forEach(item => {
        scene.remove(item);
        item.geometry.dispose();
        item.material.dispose();
      });
      // curveObjectArr = [];
      setCurveObjectArr([]);

      setOrangeLz(null);
      setBlueLz(null);
      setOrangePoint(null);
      setBluePoint(null);
    }
    moveTo(
      camera.position,
      {
        x: -1.1803,
        y: 9.6773,
        z: 5.7381
      },
      TWEEN.Easing.Quadratic.In
    );
    moveTo(controls.target, {x: 0, y: 0, z: 0}, TWEEN.Easing.Quadratic.In);
  };
  return (
    <DemoBox>
      <Button icon={<HomeOutlined />} className="home" onClick={homeClick}></Button>
      <canvas className="webgl" ref={canvasRefs} onClick={handleClick}></canvas>
    </DemoBox>
  );
}

export default EarthDemo;

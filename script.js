import * as THREE from 'three';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';

// 全局变量
let scene, camera, renderer, controls;
let boatModel, originalMaterials = {};
let raycaster, mouse;
let INTERSECTED;
let isDisassembled = false;
let parts = []; // 存储船体部件对象

// 部件数据 (示例，实际应从 JSON 或模型中获取)
const partData = {
    // --- 船体结构 (Hull Structure) ---
    'Keel': { name: '龙骨 (Keel)', function: '船体结构的基础，沿船长方向延伸，承受船体的纵向弯曲力矩，连接船首柱和船尾柱。', history: '龙骨是船舶最早出现的核心结构之一，其强度和设计直接影响船舶的整体性能和寿命。古代木船的龙骨通常由坚硬的整根木材制成。' },
    'Stem': { name: '船首柱 (Stem)', function: '构成船首的骨架，连接龙骨并向上延伸，赋予船首特定的形状以破浪。', history: '船首柱的形状对船舶的航行性能和耐波性有重要影响，从古至今有多种设计形式。' },
    'Sternpost': { name: '船尾柱 (Sternpost)', function: '构成船尾的骨架，连接龙骨并向上延伸，通常是安装船舵的地方。', history: '船尾柱的设计与船舵的安装和效率密切相关，也是船舶推进系统的重要组成部分。' },
    'Frames_Ribs': { name: '肋骨/框架 (Frames/Ribs)', function: '构成船体横向框架，连接到龙骨上，赋予船体横向强度和形状，支撑船壳板。', history: '肋骨是形成船体形状和提供横向强度的关键，其间距和尺寸根据船舶大小和用途而定。' },
    'Planking_Hull': { name: '船壳板 (Hull Planking)', function: '覆盖在船体骨架外部的木板，形成水密的外壳，保护内部结构并提供浮力。', history: '船壳板的铺设方式（如搭接或平接）和固定技术是造船工艺的重要体现，影响船体的水密性和强度。' },
    'Deck_Beams': { name: '甲板梁 (Deck Beams)', function: '横向支撑甲板的梁，连接船体两侧的肋骨，提供甲板的强度。', history: '甲板梁是支撑甲板结构和承受甲板载荷的重要构件。' },
    'Deck_Planking': { name: '甲板板 (Deck Planking)', function: '铺设在甲板梁上的木板，形成船的上层表面，供船员活动和装载货物。', history: '甲板的材料和铺设方式也随着船舶功能和技术发展而演变。' },
    'Gunwale': { name: '舷缘 (Gunwale)', function: '船舷上缘的加强结构，通常是一条坚固的木条，保护船舷并提供系缆点。', history: '舷缘不仅加固了船体上部，也是船员工作和安全的重要区域。' },

    // --- 帆装系统 (Rigging System) ---
    'Mast': { name: '桅杆 (Mast)', function: '垂直或略微倾斜的立柱，用于悬挂帆，是帆船的主要动力装置组成部分。', history: '桅杆从单根实木发展到多段拼接，材料也从木材扩展到金属和复合材料。古代大型帆船可能有多根桅杆。' },
    'Boom': { name: '帆桁/下桁 (Boom)', function: '通常水平设置，连接在桅杆底部，用于伸展主帆的下缘。', history: '帆桁使得帆的形状更容易控制，提高了帆的效率。' },
    'Yard': { name: '帆桁/上桁 (Yard)', function: '横向悬挂在桅杆上的杆件，用于悬挂横帆的上缘。', history: '帆桁是横帆船的关键部件，其长度和数量随帆的类型和船舶大小而变化。' },
    'Sails_Canvas': { name: '帆布 (Sails/Canvas)', function: '用厚实的布料（如帆布）制成，通过帆索和帆桁展开以捕捉风力，推动船只。', history: '帆的材料从早期的兽皮、草席演变为亚麻、棉帆布，现代则有各种合成纤维。帆的形状和裁剪技术对航行性能至关重要。' },
    'Standing_Rigging': { name: '固定索具 (Standing Rigging)', function: '用于支撑桅杆和船首斜桅的缆索，如侧支索、前后支索，通常是固定的。', history: '固定索具保证了桅杆在各种风力条件下的稳定性，是帆船安全航行的基础。' },
    'Running_Rigging': { name: '活动索具 (Running Rigging)', function: '用于升降和控制帆的缆索，如升降索、缭索、帆脚索，船员需要经常操作。', history: '活动索具的复杂程度反映了帆船的操作性能和帆的控制能力。' },

    // --- 舵和锚泊设备 (Steering and Anchoring) ---
    'Rudder': { name: '船舵 (Rudder)', function: '安装在船尾的水下板状装置，通过转动来改变水流方向，从而控制船只的航向。', history: '船舵的发明是航海史上的重要里程碑，从早期的桨舵发展到固定在船尾柱上的平衡舵。' },
    'Tiller_Wheel': { name: '舵柄/舵轮 (Tiller/Wheel)', function: '用于操纵船舵的杠杆或轮盘。小型船只多用舵柄，大型船只则使用舵轮通过索具或液压系统控制舵。', history: '舵轮的出现使得操纵大型船舶的舵变得更加省力。' },
    'Anchor': { name: '船锚 (Anchor)', function: '带有爪的重物，通过锚链或锚索连接到船上，抛入水中抓住水底，使船只停泊。', history: '船锚的形状和重量随船舶大小和使用环境而演变，从早期的石锚到现代的各种金属锚。' },
    'Anchor_Chain_Rope': { name: '锚链/锚索 (Anchor Chain/Rope)', function: '连接船锚和船体的链条或绳索，传递锚的抓力。', history: '锚链的强度和长度对锚泊效果至关重要。' },

    // --- 其他部件 (Other Components) ---
    'Cannons': { name: '加农炮 (Cannons)', function: '在战船或武装商船上作为武器使用，用于远程攻击。', history: '加农炮在海战中的应用改变了战争方式，其设计和装载方式也影响了船体结构。' },
    'Figurehead': { name: '船首像 (Figurehead)', function: '安装在船首的雕刻装饰，通常是神话人物、动物或象征性的图案，具有祈福、识别或威慑作用。', history: '船首像是帆船时代常见的装饰，反映了当时的文化和艺术风格，也是船舶身份的象征。' },
    'Lifeboats': { name: '救生艇 (Lifeboats)', function: '船上配备的小艇，用于在紧急情况下疏散船员和乘客。', history: '随着航海安全意识的提高，救生艇成为船舶的标配。' },
    'Capstan_Windlass': { name: '绞盘/起锚机 (Capstan/Windlass)', function: '用于起锚、升帆或拖拉重物的机械装置，通过杠杆或曲柄提供人力或动力。', history: '绞盘和起锚机的发明大大减轻了船员的体力劳动。' },

    // --- 根据GLTF模型添加的部件 ---
    'Elice_AV_1': { name: 'Elice_AV_1 (螺旋桨区域1)', function: '模型中的一个部件组，可能与推进系统相关。', history: '请根据模型具体情况补充历史信息。' },
    'Object_4': { name: 'Object_4 (物体4)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'BOAT_20': { name: 'BOAT_20 (船体20)', function: '模型中的船体主要部分。', history: '请根据模型具体情况补充历史信息。' },
    'AV_AR(B)_2': { name: 'AV_AR(B)_2 (某装置2)', function: '模型中的一个部件组。', history: '请根据模型具体情况补充历史信息。' },
    'Object_10': { name: 'Object_10 (物体10)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_7': { name: 'Object_7 (物体7)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_9': { name: 'Object_9 (物体9)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_8': { name: 'Object_8 (物体8)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'AV_AR(B)001_3': { name: 'AV_AR(B)001_3 (某装置3)', function: '模型中的一个部件组。', history: '请根据模型具体情况补充历史信息。' },
    'Object_12': { name: 'Object_12 (物体12)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'BASE01_4': { name: 'BASE01_4 (底座1)', function: '模型中的一个底座部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_15': { name: 'Object_15 (物体15)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_16': { name: 'Object_16 (物体16)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_18': { name: 'Object_18 (物体18)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_14': { name: 'Object_14 (物体14)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_19': { name: 'Object_19 (物体19)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_17': { name: 'Object_17 (物体17)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'BASE_ETG_5': { name: 'BASE_ETG_5 (某层底座)', function: '模型中的一个部件组。', history: '请根据模型具体情况补充历史信息。' },
    'Object_22': { name: 'Object_22 (物体22)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_21': { name: 'Object_21 (物体21)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'CHMS_2_6': { name: 'CHMS_2_6 (烟囱相关)', function: '模型中的一个部件组，可能与烟囱相关。', history: '请根据模型具体情况补充历史信息。' },
    'Object_25': { name: 'Object_25 (物体25)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_24': { name: 'Object_24 (物体24)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_26': { name: 'Object_26 (物体26)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Circle_7': { name: 'Circle_7 (圆形部件7)', function: '模型中的一个圆形部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_28': { name: 'Object_28 (物体28)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'D_CANON_8': { name: 'D_CANON_8 (加农炮组D)', function: '模型中的一组加农炮。', history: '请参考 Cannons 条目或根据模型具体情况补充。' },
    'Object_32': { name: 'Object_32 (物体32)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_30': { name: 'Object_30 (物体30)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_31': { name: 'Object_31 (物体31)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_33': { name: 'Object_33 (物体33)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Details_ETG_9': { name: 'Details_ETG_9 (某层细节)', function: '模型中的细节部件组。', history: '请根据模型具体情况补充历史信息。' },
    'Object_37': { name: 'Object_37 (物体37)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_39': { name: 'Object_39 (物体39)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_41': { name: 'Object_41 (物体41)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_36': { name: 'Object_36 (物体36)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_35': { name: 'Object_35 (物体35)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_38': { name: 'Object_38 (物体38)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_40': { name: 'Object_40 (物体40)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'FIRE_L_D_11': { name: 'FIRE_L_D_11 (火焰/灯光D)', function: '模型中可能与火焰效果或灯光相关的部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_46': { name: 'Object_46 (物体46)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_47': { name: 'Object_47 (物体47)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_44': { name: 'Object_44 (物体44)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_43': { name: 'Object_43 (物体43)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_45': { name: 'Object_45 (物体45)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'GATE_12': { name: 'GATE_12 (大门/通道12)', function: '模型中的一个门或通道部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_51': { name: 'Object_51 (物体51)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_50': { name: 'Object_50 (物体50)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_49': { name: 'Object_49 (物体49)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_52': { name: 'Object_52 (物体52)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'GOLD_ELMTS_13': { name: 'GOLD_ELMTS_13 (金色元素13)', function: '模型中的金色装饰元素。', history: '请根据模型具体情况补充历史信息。' },
    'Object_54': { name: 'Object_54 (物体54)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'MSSLS_AV_STBL_14': { name: 'MSSLS_AV_STBL_14 (前帆桁稳定索)', function: '模型中与前帆桁稳定相关的索具。', history: '请根据模型具体情况补充历史信息。' },
    'Object_56': { name: 'Object_56 (物体56)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_59': { name: 'Object_59 (物体59)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_58': { name: 'Object_58 (物体58)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_57': { name: 'Object_57 (物体57)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'PCQ_AV_15': { name: 'PCQ_AV_15 (前船楼)', function: '模型中的前船楼部分。', history: '请根据模型具体情况补充历史信息。' },
    'Object_61': { name: 'Object_61 (物体61)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_62': { name: 'Object_62 (物体62)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_63': { name: 'Object_63 (物体63)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'PRT_AV_M_AR_16': { name: 'PRT_AV_M_AR_16 (前中后部件16)', function: '模型中的一个跨越前中后的部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_68': { name: 'Object_68 (物体68)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_66': { name: 'Object_66 (物体66)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_67': { name: 'Object_67 (物体67)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_69': { name: 'Object_69 (物体69)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_65': { name: 'Object_65 (物体65)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_70': { name: 'Object_70 (物体70)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'SPEPAR_17': { name: 'SPEPAR_17 (特殊部件17)', function: '模型中的一个特殊部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_72': { name: 'Object_72 (物体72)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'TT_AV_18': { name: 'TT_AV_18 (前顶部件18)', function: '模型中的前部顶部部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_75': { name: 'Object_75 (物体75)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_74': { name: 'Object_74 (物体74)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_77': { name: 'Object_77 (物体77)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_76': { name: 'Object_76 (物体76)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'VLS_AV_AR_19': { name: 'VLS_AV_AR_19 (垂直发射系统)', function: '模型中的垂直发射系统部件。', history: '请根据模型具体情况补充历史信息。' },
    'Object_79': { name: 'Object_79 (物体79)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'ELICEAR_BS_22': { name: 'ELICEAR_BS_22 (螺旋桨区域22)', function: '模型中的一个部件组，可能与推进系统相关。', history: '请根据模型具体情况补充历史信息。' }, // 注意：原始名称中可能存在乱码，已尽量还原
    'Elice_AR_21': { name: 'Elice_AR_21 (螺旋桨区域21)', function: '模型中的一个部件组，可能与推进系统相关。', history: '请根据模型具体情况补充历史信息。' },
    'Object_82': { name: 'Object_82 (物体82)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' },
    'ELICE_AR_HT_24': { name: 'ELICE_AR_HT_24 (螺旋桨区域高部24)', function: '模型中的一个部件组，可能与推进系统相关。', history: '请根据模型具体情况补充历史信息。' },
    'Elice_AR001_23': { name: 'Elice_AR001_23 (螺旋桨区域23)', function: '模型中的一个部件组，可能与推进系统相关。', history: '请根据模型具体情况补充历史信息。' },
    'Object_85': { name: 'Object_85 (物体85)', function: '模型中的一个子部件。', history: '请根据模型具体情况补充历史信息。' }
    // ... 更多部件，确保键名与你的 GLTF 模型中部件的 `child.name` 对应
};

// DOM 元素
const sceneContainer = document.getElementById('scene-container');
const toggleDisassembleBtn = document.getElementById('toggle-disassemble');
const zoomSlider = document.getElementById('zoom-slider');
const togglePartsListBtn = document.getElementById('toggle-parts-list');
const partsListSidebar = document.getElementById('parts-list-sidebar');
const partsUl = document.getElementById('parts-ul');
const partInfoName = document.getElementById('part-info-name');
const partInfoDescription = document.getElementById('part-info-description');
const partInfoHistory = document.getElementById('part-info-history');
const tooltip = document.getElementById('tooltip');
const tooltipName = document.getElementById('tooltip-name');
const tooltipFunction = document.getElementById('tooltip-function');
const tooltipHistory = document.getElementById('tooltip-history');

init();
animate();

function init() {
    // 场景
    scene = new THREE.Scene();
    // 将背景颜色更改为深色，以突出模型
    scene.background = new THREE.Color(0x111122); // 深蓝灰色背景

    // 相机
    camera = new THREE.PerspectiveCamera(75, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 1000);
    camera.position.set(8, 6, 12); // 调整相机初始位置，以便更好地观察

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
    // 启用阴影渲染
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 更柔和的阴影边缘
    // 设置色调映射，以获得更逼真的外观
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputEncoding = THREE.sRGBEncoding; // 正确的颜色输出

    sceneContainer.appendChild(renderer.domElement);

    // 光照
    // 环境光，提供基础照明
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // 降低环境光强度
    scene.add(ambientLight);

    // 半球光，模拟天空和地面的反射光，使场景更自然
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    hemisphereLight.position.set(0, 20, 0);
    scene.add(hemisphereLight);

    // 方向光，模拟太阳光，用于投射阴影
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // 增强方向光强度
    directionalLight.position.set(15, 25, 20); // 调整光源位置以获得更好的阴影效果
    directionalLight.castShadow = true;
    // 配置阴影属性
    directionalLight.shadow.mapSize.width = 2048; // 提高阴影贴图分辨率
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.bias = -0.0005; // 调整阴影偏移，防止摩尔纹
    scene.add(directionalLight);

    // 可选：添加一个辅助对象来可视化方向光的阴影相机
    // const helper = new THREE.CameraHelper( directionalLight.shadow.camera );
    // scene.add( helper );

    // 控制器
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5; // 设置最小缩放距离
    controls.maxDistance = 100; // 设置最大缩放距离
    controls.target.set(0, 2, 0); // 将控制器目标设置在模型大致中心

    // Raycaster 和鼠标向量
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 加载模型 (假设有一个 'boat.gltf' 模型文件在 'models' 文件夹下)
    loadModel('models/scene.gltf');

    // 事件监听
    window.addEventListener('resize', onWindowResize, false);
    sceneContainer.addEventListener('mousemove', onMouseMove, false);
    sceneContainer.addEventListener('click', onClick, false);
    toggleDisassembleBtn.addEventListener('click', toggleDisassemble);
    zoomSlider.addEventListener('input', onZoomChange);
    togglePartsListBtn.addEventListener('click', togglePartsList);

    // 旋转控制按钮事件
    document.getElementById('rotate-x-pos').addEventListener('click', () => rotateSelected(0.1, 0, 0));
    document.getElementById('rotate-x-neg').addEventListener('click', () => rotateSelected(-0.1, 0, 0));
    document.getElementById('rotate-y-pos').addEventListener('click', () => rotateSelected(0, 0.1, 0));
    document.getElementById('rotate-y-neg').addEventListener('click', () => rotateSelected(0, -0.1, 0));
    document.getElementById('rotate-z-pos').addEventListener('click', () => rotateSelected(0, 0, 0.1));
    document.getElementById('rotate-z-neg').addEventListener('click', () => rotateSelected(0, 0, -0.1));

    // 初始化部件列表
    populatePartsList();
}

function loadModel(modelPath) {
    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
        boatModel = gltf.scene;
        scene.add(boatModel);

        // 存储原始材质并识别部件，并设置阴影
        boatModel.traverse((child) => {
            console.log('部件名称:', child.name); 
            if (child.isMesh) {
                originalMaterials[child.name] = child.material.clone();
                parts.push(child);
                // 假设部件名称与 partData 中的键对应
                if (partData[child.name]) {
                    child.userData = partData[child.name];
                }
                // 使模型部件投射和接收阴影
                child.castShadow = true;
                child.receiveShadow = true;

                // 优化材质以获得更好的视觉效果
                if (child.material) {
                    if (child.material.map) { // 如果有纹理
                        child.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy(); // 改善纹理清晰度
                    }
                    // 对于金属材质，确保 metalness 和 roughness 合理
                    if (child.material.isMeshStandardMaterial) {
                        // child.material.metalness = 0.8; // 示例：增加金属感
                        // child.material.roughness = 0.3; // 示例：调整粗糙度
                        child.material.needsUpdate = true;
                    }
                }
            }
        });
        populatePartsList(); 
        console.log('模型加载完成', boatModel);

        // 模型加载完成后，将相机聚焦到模型
        const box = new THREE.Box3().setFromObject(boatModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        controls.target.copy(center); // 将控制器目标设置为模型中心
        // 根据模型大小调整相机位置
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraDistance *= 2.5; // 调整距离因子，确保整个模型可见
        camera.position.copy(center);
        camera.position.x += cameraDistance / 2;
        camera.position.y += cameraDistance / 3;
        camera.position.z += cameraDistance;
        camera.lookAt(center);
        controls.update();

    }, undefined, (error) => {
        console.error('模型加载失败:', error);
        alert('无法加载木船模型。请确保模型文件路径正确，并在控制台查看错误详情。');
    });
}

function populatePartsList() {
    partsUl.innerHTML = ''; // 清空现有列表
    const partNames = Object.keys(partData); // 或者从 parts 数组中提取名称

    parts.forEach(part => {
        const partName = part.name || '未知部件'; // 使用网格名称
        const displayName = part.userData && part.userData.name ? part.userData.name : partName;
        const li = document.createElement('li');
        li.textContent = displayName;
        li.dataset.partName = partName; // 存储原始名称用于查找
        li.addEventListener('click', () => {
            highlightPartByName(partName, true);
            // 可选：将相机聚焦到部件
            focusOnPart(part);
        });
        partsUl.appendChild(li);
    });
}

function focusOnPart(partObject) {
    if (!partObject) return;
    const box = new THREE.Box3().setFromObject(partObject);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5; // немного дальше для лучшего обзора

    controls.target.copy(center);
    camera.position.copy(center);
    camera.position.z += cameraZ; // 调整相机距离
    camera.lookAt(center);
    controls.update();
}

function onWindowResize() {
    camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
}

function onMouseMove(event) {
    // 计算鼠标在标准化设备坐标中的位置 (-1 to +1) for both components
    mouse.x = (event.clientX / sceneContainer.clientWidth) * 2 - 1;
    // 注意：Y 坐标在 Three.js 中是反向的
    const rect = sceneContainer.getBoundingClientRect();
    mouse.y = -((event.clientY - rect.top) / sceneContainer.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(parts, true); // 确保 parts 数组包含可交互的网格

    if (intersects.length > 0) {
        const firstIntersected = intersects[0].object;
        if (INTERSECTED !== firstIntersected) {
            if (INTERSECTED) {
                // 恢复之前高亮部件的材质
                INTERSECTED.material = originalMaterials[INTERSECTED.name] ? originalMaterials[INTERSECTED.name] : INTERSECTED.material;
            }
            INTERSECTED = firstIntersected;
            // 高亮当前部件
            if (originalMaterials[INTERSECTED.name]) {
                INTERSECTED.material = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x550000 });
            }
            showTooltip(event.clientX, event.clientY, INTERSECTED.userData);
        }
    } else {
        if (INTERSECTED) {
            // 恢复之前高亮部件的材质
            INTERSECTED.material = originalMaterials[INTERSECTED.name] ? originalMaterials[INTERSECTED.name] : INTERSECTED.material;
        }
        INTERSECTED = null;
        hideTooltip();
    }
}

function onClick(event) {
    if (INTERSECTED) {
        updateInfoBar(INTERSECTED.userData);
        highlightPart(INTERSECTED, true); // 保持高亮
    }
}

function highlightPart(partObject, keepHighlight = false) {
    if (!partObject) return;

    // 恢复所有部件的原始材质
    parts.forEach(p => {
        if (originalMaterials[p.name]) {
            p.material = originalMaterials[p.name];
        }
    });

    // 高亮选定部件
    if (originalMaterials[partObject.name]) {
        partObject.material = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x005500 }); // 绿色高亮
    }

    if (!keepHighlight) {
        // 如果不是保持高亮，则 INTERSECTED 应该在 onMouseMove 中处理
    } else {
        // 如果是点击后保持高亮，则更新 INTERSECTED
        // 注意：这可能会与 onMouseMove 中的高亮逻辑冲突，需要仔细设计
    }
}

function highlightPartByName(partName, keepHighlight = false) {
    const partObject = parts.find(p => p.name === partName);
    if (partObject) {
        highlightPart(partObject, keepHighlight);
        updateInfoBar(partObject.userData);
    }
}

function updateInfoBar(data) {
    if (data) {
        partInfoName.textContent = `部件名称: ${data.name || '未知'}`;
        partInfoDescription.textContent = `描述: ${data.function || '-'}`;
        partInfoHistory.textContent = `历史背景: ${data.history || '-'}`;
    } else {
        partInfoName.textContent = '部件名称: 未选择';
        partInfoDescription.textContent = '描述: -';
        partInfoHistory.textContent = '历史背景: -';
    }
}

function showTooltip(x, y, data) {
    if (data && data.name) {
        tooltipName.textContent = data.name;
        tooltipFunction.textContent = `功能: ${data.function || '-'}`;
        tooltipHistory.textContent = `历史: ${data.history || '-'}`;
        tooltip.style.left = `${x + 15}px`;
        tooltip.style.top = `${y + 15}px`;
        tooltip.classList.remove('hidden');
    } else {
        hideTooltip();
    }
}

function hideTooltip() {
    tooltip.classList.add('hidden');
}

function toggleDisassemble() {
    isDisassembled = !isDisassembled;
    if (!boatModel) return;

    if (isDisassembled) {
        toggleDisassembleBtn.textContent = '组装';
        // 拆解逻辑：将部件沿 Y 轴分散
        parts.forEach((part, index) => {
            // 保存原始位置以便组装
            if (!part.userData.originalPosition) {
                part.userData.originalPosition = part.position.clone();
            }
            const targetY = part.userData.originalPosition.y + (index + 1) * 2; // 示例：按索引分散
            // 可以使用 Tween.js 或 requestAnimationFrame 实现平滑动画
            // 这里简单直接设置位置
            // part.position.y = targetY;
            animatePartToPosition(part, new THREE.Vector3(part.position.x, targetY, part.position.z));
        });
    } else {
        toggleDisassembleBtn.textContent = '拆解';
        // 组装逻辑：恢复部件到原始位置
        parts.forEach(part => {
            if (part.userData.originalPosition) {
                // part.position.copy(part.userData.originalPosition);
                animatePartToPosition(part, part.userData.originalPosition);
            }
        });
    }
}

function animatePartToPosition(part, targetPosition, duration = 1000) {
    const startPosition = part.position.clone();
    let startTime = null;

    function step(currentTime) {
        if (!startTime) startTime = currentTime;
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        part.position.lerpVectors(startPosition, targetPosition, progress);

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            // 动画完成
            if (isDisassembled && progress === 1) {
                // 拆解完成后的悬浮排列，例如环形
                // arrangePartsInCircle(); // 需要实现此函数
            }
        }
    }
    requestAnimationFrame(step);
}

// 示例：拖拽组装 (非常基础，需要完善)
// let draggedPart = null;
// sceneContainer.addEventListener('mousedown', (event) => {
//     if (isDisassembled && INTERSECTED) {
//         draggedPart = INTERSECTED;
//         controls.enabled = false; // 拖拽时禁用相机控制
//     }
// });
// sceneContainer.addEventListener('mouseup', () => {
//     if (draggedPart) {
//         // 检查是否拖到正确位置 (吸附逻辑)
//         // const targetPosition = draggedPart.userData.originalPosition;
//         // if (draggedPart.position.distanceTo(targetPosition) < 1) { // 假设吸附阈值为1
//         //     draggedPart.position.copy(targetPosition);
//         //     alert('组装正确!');
//         // } else {
//         //     // 归位或提示错误
//         // }
//         draggedPart = null;
//         controls.enabled = true;
//     }
// });
// sceneContainer.addEventListener('mousemove', (event) => {
//     if (draggedPart) {
//         // 将部件移动到鼠标位置 (需要在 3D 空间中正确转换鼠标坐标)
//         // 这部分比较复杂，需要 unproject 鼠标坐标到场景平面
//     }
// });

function onZoomChange(event) {
    const scale = parseFloat(event.target.value);
    if (boatModel) {
        // 简单缩放整个模型，更高级的 LOD 需要单独处理
        // camera.zoom = scale;
        // camera.updateProjectionMatrix();
        // 或者调整相机位置
        const distance = 15 / scale; // 基础距离 / 缩放因子
        camera.position.normalize().multiplyScalar(distance);
    }
}

function togglePartsList() {
    partsListSidebar.classList.toggle('visible');
}

function rotateSelected(x, y, z) {
    if (INTERSECTED) {
        INTERSECTED.rotation.x += x;
        INTERSECTED.rotation.y += y;
        INTERSECTED.rotation.z += z;
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // 仅在 enableDamping = true 时需要
    renderer.render(scene, camera);
}

// 确保在 script.js 中定义 WEBGL 对象或从 Three.js 示例中引入
const WEBGL = {
    isWebGLAvailable: function () {
        try {
            const canvas = document.createElement( 'canvas' );
            return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );
        } catch ( e ) {
            return false;
        }
    },
    getWebGLErrorMessage: function () {
        const message = 'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />' +
            'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.';
        const element = document.createElement( 'div' );
        element.id = 'webgl-error-message';
        element.innerHTML = message;
        return element;
    }
};

// WebGL 兼容性检查
if (!WEBGL.isWebGLAvailable()) {
    const warning = WEBGL.getWebGLErrorMessage();
    document.getElementById('scene-container').appendChild(warning);
    alert('您的浏览器不支持 WebGL，部分功能可能无法正常使用。');
}
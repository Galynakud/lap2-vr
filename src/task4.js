import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export function startTask4(container) {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x120f18)

    const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        20
    )
    camera.position.set(0, 0.8, 2)

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    })

    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.xr.enabled = true
    container.appendChild(renderer.domElement)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x555577, 1.5)
    hemiLight.position.set(0.5, 1, 0.25)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(2, 4, 2)
    scene.add(dirLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshStandardMaterial({
            color: 0x241f2b,
            roughness: 0.9,
            metalness: 0.05
        })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.35
    scene.add(floor)

    let reticle
    let hitTestSource = null
    let hitTestSourceRequested = false

    let loadedModel = null
    let previewModel = null
    const placedModels = []

    const loader = new GLTFLoader()

    loader.load(
        '/models/food.glb',
        (gltf) => {
            loadedModel = gltf.scene
            previewModel = loadedModel.clone(true)
            previewModel.position.set(0, -0.05, 0)
            previewModel.scale.set(1, 1, 1)
            scene.add(previewModel)
        },
        undefined,
        (error) => {
            console.error('Помилка завантаження моделі:', error)
        }
    )

    function createReticle() {
        const ringGeometry = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2)
        const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
        reticle = new THREE.Mesh(ringGeometry, ringMaterial)
        reticle.matrixAutoUpdate = false
        reticle.visible = false
        scene.add(reticle)
    }

    createReticle()

    function placeModel() {
        if (!reticle.visible || !loadedModel) return

        const modelClone = loadedModel.clone(true)
        modelClone.position.setFromMatrixPosition(reticle.matrix)
        modelClone.quaternion.setFromRotationMatrix(reticle.matrix)
        modelClone.scale.set(1, 1, 1)

        scene.add(modelClone)
        placedModels.push(modelClone)
    }

    const controller = renderer.xr.getController(0)
    controller.addEventListener('select', placeModel)
    scene.add(controller)

    let arButton = null
    if (navigator.xr) {
        arButton = ARButton.createButton(renderer, {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        })
        container.appendChild(arButton)
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', onWindowResize)

    renderer.setAnimationLoop((timestamp, frame) => {
        const inXR = renderer.xr.isPresenting

        if (inXR && frame) {
            const referenceSpace = renderer.xr.getReferenceSpace()
            const session = renderer.xr.getSession()

            if (!hitTestSourceRequested) {
                session.requestReferenceSpace('viewer').then((viewerSpace) => {
                    session.requestHitTestSource({ space: viewerSpace }).then((source) => {
                        hitTestSource = source
                    })
                })


                session.addEventListener('end', () => {
                    hitTestSourceRequested = false
                    hitTestSource = null
                    reticle.visible = false
                })

                hitTestSourceRequested = true
            }

            if (hitTestSource) {
                const hitTestResults = frame.getHitTestResults(hitTestSource)

                if (hitTestResults.length > 0) {
                    const hit = hitTestResults[0]
                    const pose = hit.getPose(referenceSpace)

                    reticle.visible = true
                    reticle.matrix.fromArray(pose.transform.matrix)
                } else {
                    reticle.visible = false
                }
            }

            if (previewModel) previewModel.visible = false
            floor.visible = false
            scene.background = null
        } else {
            if (previewModel) {
                previewModel.visible = true
                previewModel.rotation.y += 0.01
            }
            floor.visible = true
            scene.background = new THREE.Color(0x120f18)
            reticle.visible = false
        }

        placedModels.forEach((model, index) => {
            model.rotation.y += 0.01 + index * 0.001
        })

        renderer.render(scene, camera)
    })

    return () => {
        renderer.setAnimationLoop(null)
        window.removeEventListener('resize', onWindowResize)
        controller.removeEventListener('select', placeModel)
        renderer.dispose()
        container.innerHTML = ''
    }
}

import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'

export function startTask3(container) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x101018)

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

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444466, 1.5)
  hemiLight.position.set(0.5, 1, 0.25)
  scene.add(hemiLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.position.set(2, 4, 2)
  scene.add(dirLight)

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.MeshStandardMaterial({
      color: 0x22252f,
      roughness: 0.9,
      metalness: 0.1
    })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.35
  scene.add(floor)

  const objectGeometry = new THREE.OctahedronGeometry(0.18)
  const objectMaterial = new THREE.MeshStandardMaterial({
    color: 0xff8c42,
    metalness: 0.35,
    roughness: 0.35
  })

  const previewObject = new THREE.Mesh(objectGeometry, objectMaterial)
  previewObject.position.set(0, 0, 0)
  scene.add(previewObject)

  let reticle
  let hitTestSource = null
  let hitTestSourceRequested = false
  const placedObjects = []

  function createReticle() {
    const ringGeometry = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2)
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
    reticle = new THREE.Mesh(ringGeometry, ringMaterial)
    reticle.matrixAutoUpdate = false
    reticle.visible = false
    scene.add(reticle)
  }

  createReticle()

  function addObjectAtReticle() {
    if (!reticle.visible) return

    const object = new THREE.Mesh(objectGeometry, objectMaterial)
    object.position.setFromMatrixPosition(reticle.matrix)
    object.quaternion.setFromRotationMatrix(reticle.matrix)
    scene.add(object)
    placedObjects.push(object)
  }

  const controller = renderer.xr.getController(0)
  controller.addEventListener('select', addObjectAtReticle)
  scene.add(controller)

  if (navigator.xr) {
    const arButton = ARButton.createButton(renderer, {
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


      previewObject.visible = false
      floor.visible = false
      scene.background = null
    } else {
      previewObject.visible = true
      floor.visible = true
      scene.background = new THREE.Color(0x101018)

      previewObject.rotation.x += 0.01
      previewObject.rotation.y += 0.015
      reticle.visible = false
    }

    placedObjects.forEach((object, index) => {
      object.rotation.x += 0.01
      object.rotation.y += 0.01 + index * 0.001
    })

    renderer.render(scene, camera)
  })

  return () => {
    renderer.setAnimationLoop(null)
    window.removeEventListener('resize', onWindowResize)
    controller.removeEventListener('select', addObjectAtReticle)
    renderer.dispose()
    container.innerHTML = ''
  }
}

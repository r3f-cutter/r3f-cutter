import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane } from '@react-three/drei';

export default function Cutter({ children, plane }) {
  const rootGroupRef = useRef();

  const [meshList, setMeshList] = useState([]);
  const [capMaterialList, setCapMaterialList] = useState([]);
  const [planeSize, setPlaneSize] = useState(10);

  useEffect(() => {
    const meshChildren = [];
    const capMatList = [];
    const rootGroup = rootGroupRef.current;
    if (rootGroup) {
      rootGroup.traverse((child) => {
        if (child.isMesh && child.material && !child.isBrush) {
          child.geometry.computeBoundingBox();
          //
          // Add clipping planes to each mesh and make sure that the material is
          // double sided. This is needed to create PlaneStencilGroup for the
          // mesh.
          //
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              mat.clippingPlanes = [plane];
              mat.side = THREE.DoubleSide;
            });
          } else {
            child.material.clippingPlanes = [plane];
            child.material.side = THREE.DoubleSide;
          }
          meshChildren.push(child);
          //
          // Create material for the cap based on the stencil created by
          // PlaneStencilGroup for the mesh.
          //
          // :TODO: This implementation does not work if the mesh uses and array
          // of materials. This needs to be fixed.
          //
          const capMaterial = Array.isArray(child.material)
            ? child.material[0].clone()
            : child.material.clone();
          capMaterial.clippingPlanes = null;
          capMaterial.stencilWrite = true;
          capMaterial.stencilRef = 0;
          capMaterial.side = THREE.DoubleSide;
          capMaterial.stencilFunc = THREE.NotEqualStencilFunc;
          capMaterial.stencilFail = THREE.ReplaceStencilOp;
          capMaterial.stencilZFail = THREE.ReplaceStencilOp;
          capMaterial.stencilZPass = THREE.ReplaceStencilOp;
          capMatList.push(capMaterial);
        }
      });
      //
      const bbox = new THREE.Box3();
      bbox.setFromObject(rootGroup);
      //
      const boxSize = new THREE.Vector3();
      bbox.getSize(boxSize);
      //
      setPlaneSize(2.0 * boxSize.length());
    }
    //
    // Update the list of children that are meshes.
    //
    setMeshList(meshChildren);
    //
    // Dispose old cap materials.
    //
    capMaterialList.forEach((item) => item.dispose());
    //
    // Save the new cap material list.
    //
    setCapMaterialList(capMatList);
    //
    // Cleanup function for when this component is unmounted
    //
    return () => {
      capMaterialList.forEach((item) => item.dispose());
    };
  }, [rootGroupRef.current, children]);

  const planeListRef = useRef(null);

  // See
  // https://react.dev/learn/manipulating-the-dom-with-refs#how-to-manage-a-list-of-refs-using-a-ref-callback
  function getPlaneListMap() {
    if (!planeListRef.current) {
      // Initialize the Map on first usage.
      planeListRef.current = new Map();
    }
    return planeListRef.current;
  }

  useFrame(() => {
    getPlaneListMap().forEach((planeObj) => {
      if (planeObj) {
        plane.coplanarPoint(planeObj.position);
        planeObj.lookAt(
          planeObj.position.x - plane.normal.x,
          planeObj.position.y - plane.normal.y,
          planeObj.position.z - plane.normal.z
        );
      }
    });
  });

  return (
    <group>
      <group ref={rootGroupRef}>{children}</group>
      <group>
        {meshList.map((meshObj, index) => (
          // eslint-disable-next-line no-use-before-define
          <PlaneStencilGroup
            key={meshObj.id}
            meshObj={meshObj}
            plane={plane}
            renderOrder={index + 1}
          />
        ))}
      </group>
      {meshList.map((meshObj, index) => (
        <group key={meshObj.id}>
          <Plane
            ref={(node) => {
              const map = getPlaneListMap();
              if (node) {
                map.set(index, node);
              } else {
                map.delete(index);
              }
            }}
            args={[planeSize, planeSize]}
            renderOrder={index + 1.1}
            onAfterRender={(gl) => gl.clearStencil()}
            material={capMaterialList[index]}
          />
        </group>
      ))}
    </group>
  );
}

function PlaneStencilGroup({ meshObj, plane, renderOrder }) {
  //
  // :IMPORTANT: We must apply all the world transformations of the meshObj to
  // the stencil too. Otherwise, the stencil may have different
  // position/scale/rotation as compared to the original meshObj.
  //
  const parentPosition = new THREE.Vector3();
  meshObj.getWorldPosition(parentPosition);
  //
  const parentScale = new THREE.Vector3();
  meshObj.getWorldScale(parentScale);
  //
  const parentQuaternion = new THREE.Quaternion();
  meshObj.getWorldQuaternion(parentQuaternion);
  //
  return (
    meshObj && (
      <group
        position={parentPosition}
        scale={parentScale}
        quaternion={parentQuaternion}
      >
        <mesh
          geometry={meshObj.geometry}
          renderOrder={renderOrder}
        >
          <meshBasicMaterial
            depthWrite={false}
            depthTest={false}
            colorWrite={false}
            stencilWrite={true}
            stencilFunc={THREE.AlwaysStencilFunc}
            side={THREE.FrontSide}
            clippingPlanes={[plane]}
            stencilFail={THREE.DecrementWrapStencilOp}
            stencilZFail={THREE.DecrementWrapStencilOp}
            stencilZPass={THREE.DecrementWrapStencilOp}
          />
        </mesh>
        <mesh
          geometry={meshObj.geometry}
          renderOrder={renderOrder}
        >
          <meshBasicMaterial
            depthWrite={false}
            depthTest={false}
            colorWrite={false}
            stencilWrite={true}
            stencilFunc={THREE.AlwaysStencilFunc}
            side={THREE.BackSide}
            clippingPlanes={[plane]}
            stencilFail={THREE.IncrementWrapStencilOp}
            stencilZFail={THREE.IncrementWrapStencilOp}
            stencilZPass={THREE.IncrementWrapStencilOp}
          />
        </mesh>
      </group>
    )
  );
}

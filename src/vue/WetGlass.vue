<template>
    <!-- Over light effect -->
    <div
      class="bg-black transition-all duration-150 ease-in-out pointer-events-none"
      :class="overLight ? 'opacity-20' : 'opacity-0'"
      :style="overLightStyle" 
    />
    <div
      class="bg-black transition-all duration-150 ease-in-out pointer-events-none mix-blend-overlay"
      :class="overLight ? 'opacity-100' : 'opacity-0'"
      :style="overLightStyle"
    />

    <GlassContainer
      ref="glassRef"
      :class="className"
      :style="baseStyle"
      :cornerRadius="cornerRadius"
      :displacementScale="overLight ? displacementScale * 0.5 : displacementScale"
      :blurAmount="blurAmount"
      :saturation="saturation"
      :aberrationIntensity="aberrationIntensity"
      :glassSize="glassSize"
      :padding="padding"
      :mouseOffset="mouseOffset"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
      @mousedown="isActive = true"
      @mouseup="isActive = false"
      :active="isActive"
      :overLight="overLight"
      :mode="mode"
      @click="handleClick"
    >
      <slot />
    </GlassContainer>

    <!-- Border layer 1 -->
    <span :style="borderStyle('screen', 0.2, 0.12, 0.4)" />
    <!-- Border layer 2 -->
    <span :style="borderStyle('overlay', 0.32, 0.6)" />

    <!-- Hover effects -->
    <template v-if="hasClick">
      <div
        :style="hoverStyle(isHovered || isActive ? 0.5 : 0, 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 50%)')"
      />
      <div
        :style="hoverStyle(isActive ? 0.5 : 0, 'radial-gradient(circle at 50% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 80%)')"
      />
      <div
        :style="hoverMainStyle"
      />
    </template>
</template>

<script lang="ts" setup>
import { defineOptions } from "vue";
defineOptions({ name: "WetGlass" })
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'


type MousePos = { x: number; y: number }

const props = defineProps({
  displacementScale: { type: Number, default: 70 },
  blurAmount: { type: Number, default: 0.0625 },
  saturation: { type: Number, default: 140 },
  aberrationIntensity: { type: Number, default: 2 },
  elasticity: { type: Number, default: 0.15 },
  cornerRadius: { type: Number, default: 999 },
  globalMousePos: { type: Object as () => MousePos | undefined, default: undefined },
  mouseOffset: { type: Object as () => MousePos | undefined, default: undefined },
  mouseContainer: { type: Object as () => HTMLElement | null, default: null },
  className: { type: String, default: '' },
  padding: { type: String, default: '8px 16px' },
  style: { type: Object as () => any, default: () => ({}) },
  overLight: { type: Boolean, default: false },
  mode: { type: String as () => 'standard' | 'polar', default: 'standard' },
})

const emit = defineEmits<{ (e: 'click'): void }>()

const glassRef = ref<HTMLElement | null>(null)
const isHovered = ref(false)
const isActive = ref(false)
const glassSize = ref({ width: 270, height: 69 })
const internalGlobalMousePos = ref<MousePos>({ x: 0, y: 0 })
const internalMouseOffset = ref<MousePos>({ x: 0, y: 0 })

const hasClick = computed(() => !!emit)

const globalMousePos = computed(() => props.globalMousePos || internalGlobalMousePos.value)
const mouseOffset = computed(() => props.mouseOffset || internalMouseOffset.value)

const handleMouseMove = (e: MouseEvent) => {
  const container = props.mouseContainer || glassRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  internalMouseOffset.value = {
    x: ((e.clientX - centerX) / rect.width) * 100,
    y: ((e.clientY - centerY) / rect.height) * 100,
  }
  internalGlobalMousePos.value = { x: e.clientX, y: e.clientY }
}

onMounted(() => {
  if (props.globalMousePos && props.mouseOffset) return
  const container = props.mouseContainer || glassRef.value
  if (!container) return
  container.addEventListener('mousemove', handleMouseMove)
  onBeforeUnmount(() => {
    container.removeEventListener('mousemove', handleMouseMove)
  })
})

watch(
  () => glassRef.value,
  () => {
    if (!glassRef.value) return
    const update = () => {
      const rect = glassRef.value!.getBoundingClientRect()
      glassSize.value = { width: rect.width, height: rect.height }
    }
    update()
    window.addEventListener('resize', update)
    onBeforeUnmount(() => window.removeEventListener('resize', update))
  },
  { immediate: true }
)

function calculateDirectionalScale() {
  const pos = globalMousePos.value
  if (!pos.x || !pos.y || !glassRef.value) return 'scale(1)'

  const rect = glassRef.value.getBoundingClientRect()
  const pillCenterX = rect.left + rect.width / 2
  const pillCenterY = rect.top + rect.height / 2
  const pillWidth = glassSize.value.width
  const pillHeight = glassSize.value.height

  const deltaX = pos.x - pillCenterX
  const deltaY = pos.y - pillCenterY

  const edgeDistanceX = Math.max(0, Math.abs(deltaX) - pillWidth / 2)
  const edgeDistanceY = Math.max(0, Math.abs(deltaY) - pillHeight / 2)
  const edgeDistance = Math.sqrt(edgeDistanceX ** 2 + edgeDistanceY ** 2)

  const activationZone = 200
  if (edgeDistance > activationZone) return 'scale(1)'

  const fadeInFactor = 1 - edgeDistance / activationZone

  const centerDistance = Math.sqrt(deltaX ** 2 + deltaY ** 2)
  if (centerDistance === 0) return 'scale(1)'

  const normalizedX = deltaX / centerDistance
  const normalizedY = deltaY / centerDistance

  const stretchIntensity = Math.min(centerDistance / 300, 1) * props.elasticity * fadeInFactor
  const scaleX =
    1 + Math.abs(normalizedX) * stretchIntensity * 0.3 - Math.abs(normalizedY) * stretchIntensity * 0.15
  const scaleY =
    1 + Math.abs(normalizedY) * stretchIntensity * 0.3 - Math.abs(normalizedX) * stretchIntensity * 0.15

  return `scaleX(${Math.max(0.8, scaleX)}) scaleY(${Math.max(0.8, scaleY)})`
}

function calculateFadeInFactor() {
  const pos = globalMousePos.value
  if (!pos.x || !pos.y || !glassRef.value) return 0

  const rect = glassRef.value.getBoundingClientRect()
  const pillCenterX = rect.left + rect.width / 2
  const pillCenterY = rect.top + rect.height / 2
  const pillWidth = glassSize.value.width
  const pillHeight = glassSize.value.height

  const edgeDistanceX = Math.max(0, Math.abs(pos.x - pillCenterX) - pillWidth / 2)
  const edgeDistanceY = Math.max(0, Math.abs(pos.y - pillCenterY) - pillHeight / 2)
  const edgeDistance = Math.sqrt(edgeDistanceX ** 2 + edgeDistanceY ** 2)

  const activationZone = 200
  return edgeDistance > activationZone ? 0 : 1 - edgeDistance / activationZone
}

function calculateElasticTranslation() {
  if (!glassRef.value) return { x: 0, y: 0 }
  const fadeInFactor = calculateFadeInFactor()
  const rect = glassRef.value.getBoundingClientRect()
  const pillCenterX = rect.left + rect.width / 2
  const pillCenterY = rect.top + rect.height / 2

  return {
    x: (globalMousePos.value.x - pillCenterX) * props.elasticity * 0.1 * fadeInFactor,
    y: (globalMousePos.value.y - pillCenterY) * props.elasticity * 0.1 * fadeInFactor,
  }
}

const transformStyle = computed(() => {
  const translation = calculateElasticTranslation()
  return `translate(calc(-50% + ${translation.x}px), calc(-50% + ${translation.y}px)) ${
    isActive.value && hasClick.value ? 'scale(0.96)' : calculateDirectionalScale()
  }`
})

const baseStyle = computed(() => ({
  ...props.style,
  transform: transformStyle.value,
  transition: 'all ease-out 0.2s',
}))

const positionStyles = computed(() => ({
  position: baseStyle.value.position || 'relative',
  top: baseStyle.value.top || '50%',
  left: baseStyle.value.left || '50%',
}))

const overLightStyle = computed(() => ({
  ...positionStyles.value,
  height: glassSize.value.height + 'px',
  width: glassSize.value.width + 'px',
  borderRadius: `${props.cornerRadius}px`,
  transform: baseStyle.value.transform,
  transition: baseStyle.value.transition,
}))

function borderStyle(blend: string, start = 0.12, mid = 0.4, mix = 0.0) {
  return {
    ...positionStyles.value,
    height: glassSize.value.height + 'px',
    width: glassSize.value.width + 'px',
    borderRadius: `${props.cornerRadius}px`,
    transform: baseStyle.value.transform,
    transition: baseStyle.value.transition,
    pointerEvents: 'none',
    mixBlendMode: blend,
    opacity: blend === 'screen' ? 0.2 : undefined,
    padding: '1.5px',
    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    boxShadow: '0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)',
    background: `linear-gradient(${135 + mouseOffset.value.x * 1.2}deg, rgba(255,255,255,0) 0%, rgba(255,255,255,${start + Math.abs(mouseOffset.value.x) * 0.008}) ${Math.max(10, 33 + mouseOffset.value.y * 0.3)}%, rgba(255,255,255,${mid + Math.abs(mouseOffset.value.x) * 0.012}) ${Math.min(90, 66 + mouseOffset.value.y * 0.4)}%, rgba(255,255,255,0) 100%)`,
  }
}

function hoverStyle(opacity: number, img: string) {
  return {
    ...positionStyles.value,
    height: glassSize.value.height + 'px',
    width: glassSize.value.width + 1 + 'px',
    borderRadius: `${props.cornerRadius}px`,
    transform: baseStyle.value.transform,
    pointerEvents: 'none',
    transition: 'all 0.2s ease-out',
    opacity,
    backgroundImage: img,
    mixBlendMode: 'overlay',
  }
}

const hoverMainStyle = computed(() => ({
  ...baseStyle.value,
  height: glassSize.value.height + 'px',
  width: glassSize.value.width + 1 + 'px',
  borderRadius: `${props.cornerRadius}px`,
  position: baseStyle.value.position,
  top: baseStyle.value.top,
  left: baseStyle.value.left,
  pointerEvents: 'none',
  transition: 'all 0.2s ease-out',
  opacity: isHovered.value ? 0.4 : isActive.value ? 0.8 : 0,
  backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
  mixBlendMode: 'overlay',
}))

function handleClick() {
  emit('click')
}
</script>

<script lang="ts">
import { defineComponent, h } from 'vue'
import { displacementMap, polarDisplacementMap } from './utils'

export const GlassFilter = defineComponent({
  name: 'GlassFilter',
  props: {
    id: { type: String, required: true },
    displacementScale: { type: Number, required: true },
    aberrationIntensity: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    mode: { type: String as () => 'standard' | 'polar', default: 'standard' },
  },
  setup(props) {
    return () => h('svg', { style: { position: 'absolute', width: props.width, height: props.height }, 'aria-hidden': 'true' }, [
      h('defs', [
        h('radialGradient', { id: `${props.id}-edge-mask`, cx: '50%', cy: '50%', r: '50%' }, [
          h('stop', { offset: '0%', stopColor: 'black', stopOpacity: '0' }),
          h('stop', { offset: `${Math.max(30, 80 - props.aberrationIntensity * 2)}%`, stopColor: 'black', stopOpacity: '0' }),
          h('stop', { offset: '100%', stopColor: 'white', stopOpacity: '1' }),
        ]),
        h('filter', { id: props.id, x: '-35%', y: '-35%', width: '170%', height: '170%', colorInterpolationFilters: 'sRGB' }, [
          h('feImage', { id: 'feimage', x: '0', y: '0', width: '100%', height: '100%', result: 'DISPLACEMENT_MAP', href: props.mode === 'standard' ? displacementMap : polarDisplacementMap, preserveAspectRatio: 'xMidYMid slice' }),
          h('feColorMatrix', { in: 'DISPLACEMENT_MAP', type: 'matrix', values: '0.3 0.3 0.3 0 0 0.3 0.3 0.3 0 0 0.3 0.3 0.3 0 0 0 0 0 1 0', result: 'EDGE_INTENSITY' }),
          h('feComponentTransfer', { in: 'EDGE_INTENSITY', result: 'EDGE_MASK' }, [
            h('feFuncA', { type: 'discrete', tableValues: `0 ${props.aberrationIntensity * 0.05} 1` })
          ]),
          h('feOffset', { in: 'SourceGraphic', dx: '0', dy: '0', result: 'CENTER_ORIGINAL' }),
          h('feDisplacementMap', { in: 'SourceGraphic', in2: 'DISPLACEMENT_MAP', scale: props.displacementScale * -1, xChannelSelector: 'R', yChannelSelector: 'B', result: 'RED_DISPLACED' }),
          h('feColorMatrix', { in: 'RED_DISPLACED', type: 'matrix', values: '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0', result: 'RED_CHANNEL' }),
          h('feDisplacementMap', { in: 'SourceGraphic', in2: 'DISPLACEMENT_MAP', scale: props.displacementScale * (-1 - props.aberrationIntensity * 0.05), xChannelSelector: 'R', yChannelSelector: 'B', result: 'GREEN_DISPLACED' }),
          h('feColorMatrix', { in: 'GREEN_DISPLACED', type: 'matrix', values: '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0', result: 'GREEN_CHANNEL' }),
          h('feDisplacementMap', { in: 'SourceGraphic', in2: 'DISPLACEMENT_MAP', scale: props.displacementScale * (-1 - props.aberrationIntensity * 0.1), xChannelSelector: 'R', yChannelSelector: 'B', result: 'BLUE_DISPLACED' }),
          h('feColorMatrix', { in: 'BLUE_DISPLACED', type: 'matrix', values: '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0', result: 'BLUE_CHANNEL' }),
          h('feBlend', { in: 'GREEN_CHANNEL', in2: 'BLUE_CHANNEL', mode: 'screen', result: 'GB_COMBINED' }),
          h('feBlend', { in: 'RED_CHANNEL', in2: 'GB_COMBINED', mode: 'screen', result: 'RGB_COMBINED' }),
          h('feGaussianBlur', { in: 'RGB_COMBINED', stdDeviation: Math.max(0.1, 0.5 - props.aberrationIntensity * 0.1), result: 'ABERRATED_BLURRED' }),
          h('feComposite', { in: 'ABERRATED_BLURRED', in2: 'EDGE_MASK', operator: 'in', result: 'EDGE_ABERRATION' }),
          h('feComponentTransfer', { in: 'EDGE_MASK', result: 'INVERTED_MASK' }, [
            h('feFuncA', { type: 'table', tableValues: '1 0' })
          ]),
          h('feComposite', { in: 'CENTER_ORIGINAL', in2: 'INVERTED_MASK', operator: 'in', result: 'CENTER_CLEAN' }),
          h('feComposite', { in: 'EDGE_ABERRATION', in2: 'CENTER_CLEAN', operator: 'over' }),
        ])
      ])
    ])
  }
})

export const GlassContainer = defineComponent({
  name: 'GlassContainer',
  props: {
    className: { type: String, default: '' },
    style: { type: Object as () => any, default: () => ({}) },
    displacementScale: { type: Number, default: 25 },
    blurAmount: { type: Number, default: 12 },
    saturation: { type: Number, default: 180 },
    aberrationIntensity: { type: Number, default: 2 },
    mouseOffset: { type: Object as () => MousePos, default: () => ({ x: 0, y: 0 }) },
    active: { type: Boolean, default: false },
    overLight: { type: Boolean, default: false },
    cornerRadius: { type: Number, default: 999 },
    padding: { type: String, default: '8px 16px' },
    glassSize: { type: Object as () => { width: number; height: number }, default: () => ({ width: 270, height: 69 }) },
    mode: { type: String as () => 'standard' | 'polar', default: 'standard' },
  },
  emits: ['mouseenter', 'mouseleave', 'mousedown', 'mouseup', 'click'],
  setup(p, { slots, emit }) {
    const filterId = Math.random().toString(36).substring(2)
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
    const backdropStyle = {
      filter: isFirefox ? null : `url(#${filterId})`,
      backdropFilter: `blur(${(p.overLight ? 12 : 4) + p.blurAmount * 32}px) saturate(${p.saturation}%)`,
    }

    return () => h('div', { class: `relative ${p.className} ${p.active ? 'active' : ''} ${emit ? 'cursor-pointer' : ''}`, style: p.style, onClick: () => emit('click') }, [
      h(GlassFilter, { id: filterId, displacementScale: p.displacementScale, aberrationIntensity: p.aberrationIntensity, width: p.glassSize.width, height: p.glassSize.height, mode: p.mode }),
      h('div', { class: 'glass', style: { borderRadius: `${p.cornerRadius}px`, position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '24px', padding: p.padding, overflow: 'hidden', transition: 'all 0.2s ease-in-out', boxShadow: p.overLight ? '0px 16px 70px rgba(0,0,0,0.75)' : '0px 12px 40px rgba(0,0,0,0.25)' }, onMouseenter: () => emit('mouseenter'), onMouseleave: () => emit('mouseleave'), onMousedown: () => emit('mousedown'), onMouseup: () => emit('mouseup') }, [
        h('span', { class: 'glass__warp', style: { ...backdropStyle, position: 'absolute', inset: '0' } }),
        h('div', { class: 'transition-all duration-150 ease-in-out text-white', style: { position: 'relative', zIndex: 1, font: '500 20px/1 system-ui', textShadow: p.overLight ? '0px 2px 12px rgba(0, 0, 0, 0)' : '0px 2px 12px rgba(0, 0, 0, 0.4)' } }, slots.default ? slots.default() : [])
      ])
    ])
  }
})
</script>

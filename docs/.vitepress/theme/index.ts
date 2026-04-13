import DefaultTheme from 'vitepress/theme';
import mediumZoom from 'medium-zoom';
import { onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';
import './style.css';

export default {
  ...DefaultTheme,
  setup() {
    const route = useRoute();
    let zoom;

    const initZoom = () => {
      // detach previous zoom instance if exists to clean up overlay and listeners
      if (zoom) {
        zoom.detach();
      }
      // initialize new zoom instance on current images
      // .vp-doc img is the selector for markdown content images in VitePress default theme
      zoom = mediumZoom('.vp-doc img', { background: 'var(--vp-c-bg)' });
    };

    onMounted(() => {
      initZoom();
    });

    watch(
      () => route.path,
      () => nextTick(() => initZoom())
    );
  },
};

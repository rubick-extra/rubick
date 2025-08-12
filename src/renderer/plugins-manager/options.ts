// @ts-nocheck

import { getGlobal } from '@electron/remote';
import { ipcRenderer } from 'electron';
import debounce from 'lodash.debounce';
import PinyinMatch from 'pinyin-match';
import { ref, watch } from 'vue';
import useFocus from './clipboardWatch';
import pluginClickEvent from './pluginClickEvent';

function formatReg(regStr) {
  const flags = regStr.replace(/.*\/([gimy]*)$/, '$1');
  const pattern = regStr.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
  return new RegExp(pattern, flags);
}

function searchKeyValues(lists, value, strict = false) {
  return lists.filter(item => {
    if (typeof item === 'string') {
      return !!PinyinMatch.match(item, value);
    }
    if (item.type === 'regex' && !strict) {
      return formatReg(item.match).test(value);
    }
    if (item.type === 'over' && !strict) {
      return true;
    }
    return false;
  });
}

const optionsManager = ({ searchValue, appList, openPlugin, currentPlugin }) => {
  const optionsRef = ref([]);

  // 全局快捷键
  ipcRenderer.on('global-short-key', (e, msg) => {
    const options = getOptionsFromSearchValue(msg, true);
    options[0].click();
  });

  const getIndex = (cmd, value) => {
    let index = 0;
    if (PinyinMatch.match(cmd.label || cmd, value)) {
      index += 1;
    }
    if (cmd.label) {
      index -= 1;
    }
    return index;
  };

  const getOptionsFromSearchValue = (value, strict = false) => {
    const localPlugins = getGlobal('LOCAL_PLUGINS').getLocalPlugins();
    const fuzzyRegex = generateFuzzyRegex(value)
    let options: any = [];
    // todo 先搜索 plugin
    localPlugins.forEach(plugin => {
      const feature = plugin.features;
      // 系统插件无 features 的情况，不需要再搜索
      if (!feature) return;
      feature.forEach(fe => {
        const cmds = searchKeyValues(fe.cmds, value, strict);
        options = [
          ...options,
          ...cmds.map(cmd => {
            const option = {
              name: cmd.label || cmd,
              value: 'plugin',
              icon: plugin.logo,
              desc: fe.explain,
              type: plugin.pluginType,
              match: PinyinMatch.match(cmd.label || cmd, value),
              zIndex: getIndex(cmd, value), // 排序权重
              click: () => {
                pluginClickEvent({
                  plugin,
                  fe,
                  cmd,
                  ext: cmd.type
                    ? {
                        code: fe.code,
                        type: cmd.type || 'text',
                        payload: searchValue.value
                      }
                    : null,
                  openPlugin,
                  option
                });
              }
            };
            return option;
          })
        ];
      });
    });
    // todo 再搜索 app
    const appPlugins = appList.value || [];
    const descMap = new Map();
    options = [
      ...options,
      ...appPlugins
        .filter(plugin => {
          if (!descMap.get(plugin)) {
            descMap.set(plugin, true);
            let has = false;
            plugin.keyWords.some(keyWord => {
              const match = PinyinMatch.match(keyWord, value);
              const fuzzyMatch = keyWord.match(fuzzyRegex)
              if (match || fuzzyMatch) {
                has = keyWord;
                plugin.name = keyWord;
                plugin.match = match || fuzzyMatch;
                return true;
              }
              return false;
            });
            return has;
          } else {
            return false;
          }
        })
        .map(plugin => {
          const option = {
            ...plugin,
            zIndex: 0,
            click: () => {
              openPlugin(plugin, option);
            }
          };
          return option;
        })
    ];
    return options;
  };

  watch(searchValue, () => search(searchValue.value));
  // search Input operation
  const search = debounce(value => {
    if (currentPlugin.value.name) return;
    if (clipboardFile.value.length) return;
    if (!value) {
      optionsRef.value = [];
      return;
    }
    optionsRef.value = getOptionsFromSearchValue(value);
  }, 100);

  const setOptionsRef = options => {
    optionsRef.value = options;
  };

  const { searchFocus, clipboardFile, clearClipboardFile, readClipboardContent } = useFocus({
    currentPlugin,
    optionsRef,
    openPlugin,
    setOptionsRef
  });

  return {
    setOptionsRef,
    options: optionsRef,
    searchFocus,
    clipboardFile,
    clearClipboardFile,
    readClipboardContent
  };
};

function generateFuzzyRegex(keyword, options = {}) {
  const { ignoreCase = true, allowSpaces = true } = options;
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let pattern = '';
  if (allowSpaces) {
    pattern = escapedKeyword.split('').join('.*?');
  } else {
    pattern = escapedKeyword;
  }
  const flags = ignoreCase ? 'i' : '';
  return new RegExp(pattern, flags);
}

export default optionsManager;

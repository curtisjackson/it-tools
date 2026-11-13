<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { toUnicode } from 'punycode/';
import {
  type RdapObject,
  type RdapQuery,
  RdapError,
  abuseEmails,
  cidrsOf,
  contactsOf,
  eventDate,
  lookup,
  parseQuery,
  registrarOf,
  remarksOf,
} from './rdap-whois.service';
import TextareaCopyable from '@/components/TextareaCopyable.vue';
import { useQueryParam } from '@/composable/queryParams';
import type { CKeyValueListItems } from '@/ui/c-key-value-list/c-key-value-list.types';

const { t, te, locale } = useI18n();

const input = useQueryParam({ tool: 'rdap-whois', name: 'q', defaultValue: '' });
const loading = ref(false);
const error = ref('');
const noService = ref(false);
const result = ref<{ query: RdapQuery; data: RdapObject; url: string }>();

const query = computed(() => parseQuery(input.value));

async function run() {
  if (!query.value) {
    error.value = input.value.trim() ? t('tools.rdap-whois.texts.invalid') : '';
    return;
  }
  const current = query.value;
  loading.value = true;
  error.value = '';
  noService.value = false;
  result.value = undefined;
  try {
    result.value = { query: current, ...(await lookup(current)) };
  } catch (cause) {
    if (cause instanceof RdapError) {
      noService.value = /no rdap service/i.test(cause.message);
      error.value = noService.value
        ? t('tools.rdap-whois.texts.error-no-service')
        : cause.status === 404
          ? t('tools.rdap-whois.texts.error-not-found')
          : cause.status === 429
            ? t('tools.rdap-whois.texts.error-rate-limit')
            : t('tools.rdap-whois.texts.error-other', [cause.status, cause.message]);
    } else {
      error.value = t('tools.rdap-whois.texts.error-network', [(cause as Error).message]);
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (query.value) {
    run();
  }
});

function formatDate(value?: string) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(locale.value);
}

function country(code?: string) {
  if (!code) {
    return undefined;
  }
  try {
    const name = new Intl.DisplayNames([locale.value], { type: 'region' }).of(code.toUpperCase());
    return name && name !== code.toUpperCase() ? `${name} (${code.toUpperCase()})` : code.toUpperCase();
  } catch {
    return code;
  }
}

const label = (key: string) => t(`tools.rdap-whois.texts.field-${key}`);

const summary = computed<CKeyValueListItems>(() => {
  const data = result.value?.data;
  if (!data) {
    return [];
  }
  const items: CKeyValueListItems = [];
  const add = (key: string, value: string | string[] | undefined) => {
    if (value !== undefined && value !== '' && !(Array.isArray(value) && !value.length)) {
      items.push({ label: label(key), value });
    }
  };
  switch (result.value!.query.kind) {
    case 'ip':
      add('range', data.startAddress && data.endAddress ? `${data.startAddress} – ${data.endAddress}` : undefined);
      add('cidr', cidrsOf(data));
      add('name', data.name);
      add('type', data.type);
      add('country', country(data.country));
      add('handle', data.handle);
      add('parent', data.parentHandle);
      break;
    case 'autnum':
      add(
        'as-range',
        data.startAutnum === data.endAutnum ? `AS${data.startAutnum}` : `AS${data.startAutnum} – AS${data.endAutnum}`,
      );
      add('name', data.name);
      add('type', data.type);
      add('country', country(data.country));
      add('handle', data.handle);
      break;
    case 'domain': {
      const name = (data.ldhName ?? '').toLowerCase();
      const unicode = data.unicodeName ?? toUnicode(name);
      add('name', unicode && unicode !== name ? `${unicode} (${name})` : name);
      add('registrar', registrarOf(data));
      add(
        'nameservers',
        (data.nameservers ?? []).map((server) => (server.ldhName ?? '').toLowerCase()).filter(Boolean),
      );
      if (data.secureDNS) {
        add('dnssec', t(`tools.rdap-whois.texts.dnssec-${data.secureDNS.delegationSigned ? 'signed' : 'unsigned'}`));
      }
      add('handle', data.handle);
      break;
    }
  }
  add('abuse', abuseEmails(data));
  add('status', data.status?.join(', '));
  add('registered', formatDate(eventDate(data, 'registration')));
  add('changed', formatDate(eventDate(data, 'last changed')));
  add('expires', formatDate(eventDate(data, 'expiration')));
  add('whois', data.port43);
  return items;
});

const contacts = computed(() => (result.value ? contactsOf(result.value.data) : []));
const remarks = computed(() => (result.value ? remarksOf(result.value.data) : []));
const raw = computed(() => (result.value ? JSON.stringify(result.value.data, null, 2) : ''));
const sourceHost = computed(() => (result.value ? new URL(result.value.url).host : ''));

function role(name: string) {
  const key = `tools.rdap-whois.texts.role-${name.replace(/\s+/g, '-')}`;
  return te(key) ? t(key) : name;
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div mx-auto max-w-900px>
      <c-card mb-3>
        <div flex items-end gap-2>
          <c-input-text
            v-model:value="input"
            :label="t('tools.rdap-whois.texts.label-query')"
            :placeholder="t('tools.rdap-whois.texts.placeholder-query')"
            raw-text
            flex-1
            data-test-id="query"
            @keyup.enter="run"
          />
          <c-button type="primary" :loading="loading" :disabled="!query" data-test-id="lookup" @click="run">
            {{ t('tools.rdap-whois.texts.lookup') }}
          </c-button>
        </div>
        <n-text v-if="input.trim() && !query" depth="3" mt-2 block text-sm>
          {{ t('tools.rdap-whois.texts.invalid') }}
        </n-text>
      </c-card>

      <c-alert v-if="error" type="warning" mb-3 data-test-id="error">
        {{ error }}
        <div v-if="noService && query" mt-2>
          <c-link :href="`https://www.whois.com/whois/${query.value}`" target="_blank" rel="noopener">
            {{ t('tools.rdap-whois.texts.open-whois-com') }}
          </c-link>
        </div>
      </c-alert>

      <template v-if="result">
        <c-card :title="t(`tools.rdap-whois.texts.kind-${result.query.kind}`)" mb-3 data-test-id="summary">
          <c-key-value-list :items="summary" />
          <n-text depth="3" mt-3 block text-xs>
            <c-link :href="result.url" target="_blank" rel="noopener">
              {{ t('tools.rdap-whois.texts.source', [sourceHost]) }}
            </c-link>
          </n-text>
        </c-card>

        <c-card v-if="contacts.length" :title="t('tools.rdap-whois.texts.contacts')" mb-3>
          <n-table size="small" :single-line="false" data-test-id="contacts">
            <thead>
              <tr>
                <th>{{ t('tools.rdap-whois.texts.column-role') }}</th>
                <th>{{ t('tools.rdap-whois.texts.column-contact') }}</th>
                <th>{{ t('tools.rdap-whois.texts.column-details') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="contact in contacts" :key="contact.handle + contact.name">
                <td>{{ contact.roles.map(role).join(', ') }}</td>
                <td>
                  <div>{{ contact.name }}</div>
                  <n-text v-if="contact.handle" depth="3" text-xs font-mono>
                    {{ contact.handle }}
                  </n-text>
                </td>
                <td>
                  <div v-for="email in contact.emails" :key="email">
                    <c-link :href="`mailto:${email}`">
                      {{ email }}
                    </c-link>
                  </div>
                  <div v-for="phone in contact.phones" :key="phone">
                    {{ phone }}
                  </div>
                  <n-text v-if="contact.address" depth="3" text-xs>
                    {{ contact.address }}
                  </n-text>
                </td>
              </tr>
            </tbody>
          </n-table>
        </c-card>

        <c-card v-if="remarks.length" :title="t('tools.rdap-whois.texts.remarks')" mb-3>
          <div v-for="(remark, index) in remarks" :key="index" mb-2 whitespace-pre-wrap text-sm>
            {{ remark }}
          </div>
        </c-card>

        <c-collapse :title="t('tools.rdap-whois.texts.raw')">
          <TextareaCopyable :value="raw" language="json" />
        </c-collapse>
      </template>
    </div>
  </div>
</template>

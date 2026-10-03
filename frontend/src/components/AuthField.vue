<template>
  <!-- Label en capitales au-dessus du champ, icône à gauche dans le champ.
       L'œil passe SOUS le champ, pas dedans : c'est ce que montre la capture,
       et le libellé du bouton reste lisible sur les petits écrans. -->
  <div class="f">
    <label class="f__label" :for="id">{{ label }}</label>

    <div class="f__box">
      <span class="f__icon" aria-hidden="true">
        <svg class="ic ic--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path :d="icone" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>

      <input
        :id="id"
        class="f__input"
        :class="{ 'is-focus': focus }"
        :type="type === 'password' && visible ? 'text' : type"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :aria-invalid="erreur ? 'true' : undefined"
        :aria-describedby="erreur ? id + '-err' : undefined"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="focus = true"
        @blur="focus = false"
      />

      <span v-if="prefixe" class="f__prefixe">{{ prefixe }}</span>
    </div>

    <button
      v-if="type === 'password'"
      type="button"
      class="f__oeil"
      :aria-label="visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <svg class="ic ic--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
        <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" stroke-linejoin="round" />
        <circle cx="12" cy="12" r="2.6" />
      </svg>
    </button>

    <p v-if="erreur" :id="id + '-err'" class="f__err" role="alert">{{ erreur }}</p>
  </div>
</template>

<script setup>
import { ref, useId } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  icone: { type: String, default: 'M4 6h16v12H4z' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  inputmode: { type: String, default: undefined },
  prefixe: { type: String, default: '' },
  erreur: { type: String, default: '' }
})
defineEmits(['update:modelValue'])

const id = useId()
const focus = ref(false)
const visible = ref(false)
</script>

<style scoped>
.f {
  display: grid;
  gap: 8px;
  position: relative;
}

.f__label {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--lichen);
}

.f__box {
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 54px;
  padding: 0 16px;
  border-radius: var(--r-sm);
  background: var(--panel);
  border: 1px solid var(--line);
  transition: border-color var(--dur-1) var(--ease-out);
}

.f__box:hover {
  border-color: var(--line-2);
}

/* Le focus est porté par la bordure : c'est ce que montre la capture,
   et c'est ce que WCAG AA exige. */
.f__box:has(.f__input.is-focus) {
  border-color: var(--sprout);
  outline: 1px solid var(--sprout);
  outline-offset: -1px;
}

.f__input.is-focus {
  outline: none;
}

.f__icon {
  flex: none;
  color: var(--fern);
}

.f__input {
  flex: 1 1 auto;
  min-width: 0;
  background: none;
  border: none;
  color: var(--white);
  font: inherit;
  font-size: 16px;
  padding: 0;
}

.f__input::placeholder {
  color: var(--lichen);
}

.f__input:focus {
  outline: none;
}

.f__prefixe {
  flex: none;
  font-size: 15px;
  color: var(--fern);
}

/* L'œil est SOUS le champ, pas dedans : c'est ce que montre la capture.
   Le margin-top négatif le remonte juste sous la bordure. */
.f__oeil {
  justify-self: end;
  margin-top: -14px;
  margin-right: -4px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: var(--r-xs);
  color: var(--fern);
}

.f__oeil:hover {
  color: var(--white);
}

.f__err {
  margin: 0;
  font-size: 13px;
  color: var(--danger);
}
</style>
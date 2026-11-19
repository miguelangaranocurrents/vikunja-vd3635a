import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

const BULLET_LIST_TYPES = ['bulletList', 'taskList']
const ORDERED_LIST_TYPES = ['orderedList']
const LIST_ITEM_TYPES = ['listItem', 'taskItem']

/**
 * Plain text for copied editor content. ProseMirror's default drops list markers, so a
 * copied bullet list would paste as bare lines. Keeps "- " and "1. " markers and puts
 * every block on its own line.
 */
export function sliceToPlainText(slice: Slice): string {
	const lines: string[] = []
	slice.content.forEach(node => collectBlock(node, lines))
	return lines.join('\n')
}

function collectBlock(node: ProseMirrorNode, lines: string[]) {
	if (node.isTextblock) {
		lines.push(node.textContent)
		return
	}

	if (BULLET_LIST_TYPES.includes(node.type.name)) {
		collectList(node.content, () => '- ', lines)
		return
	}

	if (ORDERED_LIST_TYPES.includes(node.type.name)) {
		collectList(node.content, index => `${index + 1}. `, lines)
		return
	}

	if (node.isLeaf) {
		return
	}

	node.forEach(child => collectBlock(child, lines))
}

function collectList(
	items: Fragment,
	marker: (index: number) => string,
	lines: string[],
) {
	let index = 0
	items.forEach(item => {
		if (!LIST_ITEM_TYPES.includes(item.type.name)) {
			collectBlock(item, lines)
			return
		}

		const prefix = item.type.name === 'taskItem'
			? `${marker(index)}[${item.attrs.checked ? 'x' : ' '}] `
			: marker(index)
		const indent = ' '.repeat(prefix.length)
		const itemLines: string[] = []
		item.forEach(child => collectBlock(child, itemLines))

		if (itemLines.length === 0) {
			itemLines.push('')
		}
		itemLines.forEach((line, lineIndex) => {
			lines.push((lineIndex === 0 ? prefix : indent) + line)
		})
		index++
	})
}

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复按钮标题映射
fixes = [
    (r'<button @click="showCreateModal=false" class="absolute top-3 right-3', 
     '<button @click="showCreateModal=false" title="Close" class="absolute top-3 right-3'),
    
    (r'<button @click\.stop="copyText\(lab\.code\)" class="text-\[10px\] bg-gray-100',
     '<button @click.stop="copyText(lab.code)" title="Copy Code" class="text-[10px] bg-gray-100'),
    
    (r'<button @click\.stop="shareCodeToChat\(lab\)" class="text-\[10px\] bg-green-100',
     '<button @click.stop="shareCodeToChat(lab)" title="Share Code" class="text-[10px] bg-green-100'),
    
    (r'<button v-if="isOwner\(lab\)" @click\.stop="confirmDeleteLab\(lab\.id\)" class="text-gray-300',
     '<button v-if="isOwner(lab)" @click.stop="confirmDeleteLab(lab.id)" title="Delete Lab" class="text-gray-300'),
    
    (r'<button @click\.stop="deleteCollection\(item\.id\)" class="absolute top-2 right-2 text-gray-300',
     '<button @click.stop="deleteCollection(item.id)" title="Delete Item" class="absolute top-2 right-2 text-gray-300'),
    
    (r'<button @click\.stop="deleteFriend\(f\)" class="absolute top-2 right-2 text-gray-300',
     '<button @click.stop="deleteFriend(f)" title="Remove Friend" class="absolute top-2 right-2 text-gray-300'),
    
    (r'<button @click="exitLab" class="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center',
     '<button @click="exitLab" title="Exit Lab" class="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center'),
    
    (r'<button @click="addToCanvas\(file\)" class="w-8 h-8 rounded-full bg-white border hover:bg-blue-50',
     '<button @click="addToCanvas(file)" title="Add to Canvas" class="w-8 h-8 rounded-full bg-white border hover:bg-blue-50'),
    
    (r'<button v-if="selectedElIds\.includes\(el\.id\) && !connectMode" @click\.stop="deleteEl\(el\.id\)" class="absolute -top-3 -right-3',
     '<button v-if="selectedElIds.includes(el.id) && !connectMode" @click.stop="deleteEl(el.id)" title="Delete Element" class="absolute -top-3 -right-3'),
    
    (r'<button @click\.stop="el\.setupMode=false" class="px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-bold py-2 rounded-lg transition shadow-lg">Done',
     '<button @click.stop="el.setupMode=false" title="Done" class="px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-bold py-2 rounded-lg transition shadow-lg">Done'),
    
    (r'<button @click\.stop="el\.editMode=!el\.editMode;saveLab\(\)" class="w-6 h-6 rounded bg-white border hover:bg-blue-50',
     '<button @click.stop="el.editMode=!el.editMode;saveLab()" title="Edit" class="w-6 h-6 rounded bg-white border hover:bg-blue-50'),
    
    (r'<button @click\.stop="toggleStepNote\(s\)" class="text-gray-300 hover:text-orange-500 opacity-0',
     '<button @click.stop="toggleStepNote(s)" title="Add Note" class="text-gray-300 hover:text-orange-500 opacity-0'),
    
    (r'<button @click\.stop="shareProtocolToChat\(el\)" class="w-6 h-6 rounded bg-blue-50',
     '<button @click.stop="shareProtocolToChat(el)" title="Share Protocol" class="w-6 h-6 rounded bg-blue-50'),
]

for pattern, replacement in fixes:
    content = re.sub(pattern, replacement, content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ 按钮标题修复完成')

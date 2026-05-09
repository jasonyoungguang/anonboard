package com.anonboard.family.service;

import com.anonboard.family.entity.FamilyRelationship;
import com.anonboard.family.mapper.FamilyRelationshipMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class FamilyGraphValidator {

    private final FamilyRelationshipMapper relationshipMapper;

    public FamilyGraphValidator(FamilyRelationshipMapper relationshipMapper) {
        this.relationshipMapper = relationshipMapper;
    }

    /**
     * 从 parentId 向上遍历祖先，检查是否可达 childId，防止循环引用。
     *
     * @param parentId 拟设为父母的成员 ID
     * @param childId  拟设为子女的成员 ID
     * @return true 表示存在循环
     */
    public boolean hasAncestorCycle(Long parentId, Long childId) {
        if (parentId.equals(childId)) {
            return true;
        }

        Set<Long> visited = new HashSet<>();
        Queue<Long> queue = new LinkedList<>();
        queue.add(parentId);

        while (!queue.isEmpty()) {
            Long current = queue.poll();
            if (current.equals(childId)) {
                return true;
            }
            if (!visited.add(current)) {
                continue;
            }

            // 查找 current 的父母（memberBId = current 的 parent-child 关系，memberAId 即为其父母）
            LambdaQueryWrapper<FamilyRelationship> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(FamilyRelationship::getMemberBId, current)
                   .eq(FamilyRelationship::getRelationType, "parent-child");
            List<FamilyRelationship> parentRels = relationshipMapper.selectList(wrapper);

            for (FamilyRelationship rel : parentRels) {
                queue.add(rel.getMemberAId());
            }
        }

        return false;
    }
}

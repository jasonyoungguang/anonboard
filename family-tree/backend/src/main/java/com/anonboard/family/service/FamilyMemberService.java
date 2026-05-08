package com.anonboard.family.service;

import com.anonboard.family.entity.FamilyMember;
import com.anonboard.family.entity.FamilyRelationship;
import com.anonboard.family.mapper.FamilyMemberMapper;
import com.anonboard.family.mapper.FamilyRelationshipMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FamilyMemberService {

    private final FamilyMemberMapper memberMapper;
    private final FamilyRelationshipMapper relationshipMapper;

    public FamilyMemberService(FamilyMemberMapper memberMapper, FamilyRelationshipMapper relationshipMapper) {
        this.memberMapper = memberMapper;
        this.relationshipMapper = relationshipMapper;
    }

    public List<FamilyMember> getAllMembers() {
        return memberMapper.selectList(null);
    }

    public FamilyMember getById(Long id) {
        return memberMapper.selectById(id);
    }

    public boolean addMember(FamilyMember member) {
        return memberMapper.insert(member) > 0;
    }

    public boolean updateMember(FamilyMember member) {
        return memberMapper.updateById(member) > 0;
    }

    public boolean deleteMember(Long id) {
        return memberMapper.deleteById(id) > 0;
    }

    public List<FamilyMember> getMembersByGeneration(int generation) {
        LambdaQueryWrapper<FamilyMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyMember::getGeneration, generation);
        return memberMapper.selectList(wrapper);
    }

    @Transactional
    public boolean addRelative(Long existingId, FamilyMember newMember, boolean isParent) {
        memberMapper.insert(newMember);

        FamilyRelationship rel = new FamilyRelationship();
        if (isParent) {
            rel.setMemberAId(newMember.getId());
            rel.setMemberBId(existingId);

            // 如果是添加父母，检查孩子是否已有另一个异性父母，自动创建配偶关系
            createSpouseIfBothParentsExist(existingId, newMember);
        } else {
            rel.setMemberAId(existingId);
            rel.setMemberBId(newMember.getId());
        }
        rel.setRelationType("parent-child");
        return relationshipMapper.insert(rel) > 0;
    }

    /**
     * 如果添加父母时，孩子已有另一个异性父母，自动创建配偶关系
     */
    private void createSpouseIfBothParentsExist(Long childId, FamilyMember newParent) {
        // 查找该孩子的所有父母
        LambdaQueryWrapper<FamilyRelationship> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyRelationship::getMemberBId, childId)
               .eq(FamilyRelationship::getRelationType, "parent-child");
        List<FamilyRelationship> parentRels = relationshipMapper.selectList(wrapper);

        for (FamilyRelationship pr : parentRels) {
            FamilyMember existingParent = memberMapper.selectById(pr.getMemberAId());
            if (existingParent != null 
                && !existingParent.getId().equals(newParent.getId())
                && existingParent.getGender() != null 
                && !existingParent.getGender().equals(newParent.getGender())) {
                // 找到另一个异性父母，创建配偶关系
                FamilyRelationship spouseRel = new FamilyRelationship();
                spouseRel.setMemberAId(newParent.getId());
                spouseRel.setMemberBId(existingParent.getId());
                spouseRel.setRelationType("spouse");
                relationshipMapper.insert(spouseRel);
                break;
            }
        }
    }
}

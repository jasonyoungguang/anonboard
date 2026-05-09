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
        LambdaQueryWrapper<FamilyMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyMember::getIsDeleted, false);
        return memberMapper.selectList(wrapper);
    }

    public FamilyMember getById(Long id) {
        FamilyMember member = memberMapper.selectById(id);
        if (member != null && Boolean.TRUE.equals(member.getIsDeleted())) {
            return null;
        }
        return member;
    }

    public boolean addMember(FamilyMember member) {
        return memberMapper.insert(member) > 0;
    }

    public boolean updateMember(FamilyMember member) {
        return memberMapper.updateById(member) > 0;
    }

    @Transactional
    public boolean deleteMember(Long id) {
        // 删除该成员相关的所有关系（硬删除关系）
        LambdaQueryWrapper<FamilyRelationship> relWrapper = new LambdaQueryWrapper<>();
        relWrapper.eq(FamilyRelationship::getMemberAId, id)
                  .or()
                  .eq(FamilyRelationship::getMemberBId, id);
        relationshipMapper.delete(relWrapper);
        // 软删除成员
        FamilyMember member = memberMapper.selectById(id);
        if (member == null) return false;
        member.setIsDeleted(true);
        return memberMapper.updateById(member) > 0;
    }

    @Transactional
    public boolean hardDeleteMember(Long id) {
        LambdaQueryWrapper<FamilyRelationship> relWrapper = new LambdaQueryWrapper<>();
        relWrapper.eq(FamilyRelationship::getMemberAId, id)
                  .or()
                  .eq(FamilyRelationship::getMemberBId, id);
        relationshipMapper.delete(relWrapper);
        return memberMapper.deleteById(id) > 0;
    }

    public boolean restoreMember(Long id) {
        FamilyMember member = memberMapper.selectById(id);
        if (member == null) return false;
        member.setIsDeleted(false);
        return memberMapper.updateById(member) > 0;
    }

    public List<FamilyMember> getDeletedMembers() {
        LambdaQueryWrapper<FamilyMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyMember::getIsDeleted, true);
        return memberMapper.selectList(wrapper);
    }

    public List<FamilyMember> getMembersByGeneration(int generation) {
        LambdaQueryWrapper<FamilyMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FamilyMember::getGeneration, generation)
               .eq(FamilyMember::getIsDeleted, false);
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

    private void createSpouseIfBothParentsExist(Long childId, FamilyMember newParent) {
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
                FamilyRelationship spouseRel = new FamilyRelationship();
                spouseRel.setMemberAId(newParent.getId());
                spouseRel.setMemberBId(existingParent.getId());
                spouseRel.setRelationType("spouse");
                relationshipMapper.insert(spouseRel);
                break;
            }
        }
    }

    @Transactional
    public boolean addSpouse(Long existingId, FamilyMember spouse) {
        memberMapper.insert(spouse);

        FamilyRelationship rel = new FamilyRelationship();
        rel.setMemberAId(existingId);
        rel.setMemberBId(spouse.getId());
        rel.setRelationType("spouse");
        return relationshipMapper.insert(rel) > 0;
    }

    /**
     * 统计活跃成员信息
     */
    public StatsInfo getStats() {
        List<FamilyMember> activeMembers = getAllMembers();
        long maleCount = 0, femaleCount = 0, unknownGenderCount = 0;
        Integer minGen = null, maxGen = null;

        for (FamilyMember m : activeMembers) {
            if (m.getGender() == null || m.getGender() == 0) {
                unknownGenderCount++;
            } else if (m.getGender() == 1) {
                maleCount++;
            } else if (m.getGender() == 2) {
                femaleCount++;
            }
            if (m.getGeneration() != null) {
                if (minGen == null || m.getGeneration() < minGen) minGen = m.getGeneration();
                if (maxGen == null || m.getGeneration() > maxGen) maxGen = m.getGeneration();
            }
        }

        StatsInfo info = new StatsInfo();
        info.totalMembers = activeMembers.size();
        info.maleCount = maleCount;
        info.femaleCount = femaleCount;
        info.unknownGenderCount = unknownGenderCount;
        info.minGeneration = minGen;
        info.maxGeneration = maxGen;
        return info;
    }

    public static class StatsInfo {
        public long totalMembers;
        public long maleCount;
        public long femaleCount;
        public long unknownGenderCount;
        public Integer minGeneration;
        public Integer maxGeneration;
    }
}
